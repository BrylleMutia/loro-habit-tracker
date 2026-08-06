import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const warnings = [];

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const walkMarkdown = (directory) => {
  const absoluteDirectory = path.join(root, directory);
  if (!fs.existsSync(absoluteDirectory)) return [];
  const result = [];
  for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walkMarkdown(relativePath));
    else if (entry.isFile() && entry.name.endsWith(".md")) result.push(relativePath);
  }
  return result;
};

const markdownFiles = ["README.md", "AGENTS.md", ...walkMarkdown("docs")];

const stripCodeFences = (content) => content.replace(/```[\s\S]*?```/g, "");

const slugify = (heading) => heading
  .replace(/<[^>]+>/g, "")
  .replace(/[`*_]/g, "")
  .trim()
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9\s-]/g, "")
  .replace(/\s+/g, "-");

const anchorsFor = (content) => {
  const anchors = new Set();
  for (const match of content.matchAll(/\bid=["']([^"']+)["']/g)) anchors.add(match[1]);
  for (const match of content.matchAll(/^#{1,6}\s+(.+)$/gm)) anchors.add(slugify(match[1]));
  return anchors;
};

const resolveTarget = (sourceRelativePath, target) => {
  const cleanTarget = target.trim().replace(/^<|>$/g, "").split(/\s+/)[0];
  if (!cleanTarget || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(cleanTarget)) return null;
  const hashIndex = cleanTarget.indexOf("#");
  const rawPath = hashIndex < 0 ? cleanTarget : cleanTarget.slice(0, hashIndex);
  const fragment = hashIndex < 0 ? "" : decodeURIComponent(cleanTarget.slice(hashIndex + 1));
  const sourceDirectory = path.dirname(path.join(root, sourceRelativePath));
  const targetPath = rawPath ? path.resolve(sourceDirectory, rawPath) : path.join(root, sourceRelativePath);
  return { targetPath, fragment };
};

for (const sourceRelativePath of markdownFiles) {
  const sourceContent = read(sourceRelativePath);
  const contentWithoutCode = stripCodeFences(sourceContent);
  if (/\]\.(?:\.\/|\/)/.test(contentWithoutCode)) {
    errors.push(`${sourceRelativePath}: malformed Markdown link missing parentheses`);
  }
  for (const match of contentWithoutCode.matchAll(/\[[^\]]*\]\(([^)\n]+)\)/g)) {
    const resolved = resolveTarget(sourceRelativePath, match[1]);
    if (!resolved) continue;
    if (!fs.existsSync(resolved.targetPath)) {
      errors.push(`${sourceRelativePath}: missing link target ${match[1]}`);
      continue;
    }
    if (!resolved.fragment) continue;
    const targetContent = fs.statSync(resolved.targetPath).isFile()
      ? fs.readFileSync(resolved.targetPath, "utf8")
      : "";
    if (targetContent && !anchorsFor(targetContent).has(resolved.fragment)) {
      errors.push(`${sourceRelativePath}: missing anchor ${match[1]}`);
    }
  }
}

const plans = read("docs/PLANS.md");
const agents = read("AGENTS.md");
for (const staleSection of ["Feature Details", "Detailed Delivery Blueprints"]) {
  if (plans.includes(staleSection)) errors.push(`docs/PLANS.md still contains removed section: ${staleSection}`);
}
if (!agents.includes("Do not load every file under `docs/features/`, `docs/decisions/`, or `docs/history/`")) {
  errors.push("AGENTS.md is missing the selective documentation-routing rule");
}
if (!agents.includes("history only for historical/documentation work or explicit user requests")) {
  errors.push("AGENTS.md is missing the history-routing rule");
}

const matrixIds = [...plans.matchAll(/\|\s*\[(\d+)\]\(features\/feature-(\d+)\.md#feature-\d+\)/g)]
  .map((match) => Number(match[1]));
const featureFiles = fs.readdirSync(path.join(root, "docs", "features"))
  .filter((name) => /^feature-\d+\.md$/.test(name))
  .map((name) => Number(name.match(/\d+/)[0]))
  .sort((a, b) => a - b);
const expectedFeatureIds = [...new Set(matrixIds)].sort((a, b) => a - b);
if (JSON.stringify(featureFiles) !== JSON.stringify(expectedFeatureIds)) {
  errors.push(`Feature file inventory mismatch: matrix=${expectedFeatureIds.join(",")} files=${featureFiles.join(",")}`);
}
if (featureFiles.includes(9)) errors.push("Feature #9 must remain unallocated; feature-09.md must not exist");

const expectedBlueprintIds = [4, 5, 7, 8, ...Array.from({ length: 35 }, (_, index) => index + 10)];
for (const id of expectedFeatureIds) {
  const filePath = path.join(root, "docs", "features", `feature-${String(id).padStart(2, "0")}.md`);
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.includes(`id="feature-${id}"`)) errors.push(`feature-${String(id).padStart(2, "0")}.md is missing feature-${id} anchor`);
}
for (const id of expectedBlueprintIds) {
  const filePath = path.join(root, "docs", "features", `feature-${String(id).padStart(2, "0")}.md`);
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  if (!content.includes(`id="blueprint-feature-${id}"`)) errors.push(`Blueprint ${id} is missing from its feature contract`);
  if (!plans.includes(`id="blueprint-feature-${id}"`)) errors.push(`Legacy blueprint anchor ${id} is missing from docs/PLANS.md`);
}
for (const id of expectedFeatureIds) {
  if (!plans.includes(`id="feature-${id}"`)) errors.push(`Legacy feature anchor ${id} is missing from docs/PLANS.md`);
}

const footprintFiles = ["AGENTS.md", "docs/PLANS.md", ...walkMarkdown("docs/features"), ...walkMarkdown("docs/decisions"), ...walkMarkdown("docs/history")];
const footprint = footprintFiles.map((relativePath) => {
  const content = read(relativePath);
  const words = content.match(/\S+/g)?.length ?? 0;
  return {
    file: relativePath,
    bytes: Buffer.byteLength(content, "utf8"),
    lines: content.split(/\r?\n/).length,
    words,
    minTokens: Math.round(words * 1.3),
    maxTokens: Math.round(content.length / 4),
  };
});
const findFootprint = (relativePath) => footprint.find((entry) => entry.file === relativePath);
const plansFootprint = findFootprint("docs/PLANS.md");
const agentsFootprint = findFootprint("AGENTS.md");
if (plansFootprint.maxTokens > 5000) warnings.push(`docs/PLANS.md is above the 5k estimated-token target (${plansFootprint.minTokens}-${plansFootprint.maxTokens})`);
if (agentsFootprint.maxTokens > 3200) warnings.push(`AGENTS.md is above the compressed estimated-token target (${agentsFootprint.minTokens}-${agentsFootprint.maxTokens})`);

console.log("Documentation footprint:");
console.table(footprint);
for (const warning of warnings) console.warn(`WARNING: ${warning}`);
if (errors.length) {
  console.error("Documentation validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation validation passed for ${markdownFiles.length} Markdown files.`);
}
