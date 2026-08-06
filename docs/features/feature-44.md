# Feature #44 - Asset Optimization and Bundle Budgets (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-44)

### <a id="feature-44"></a>44. Asset Optimization and Bundle Budgets (P2)

**What:** Add a repeatable asset pipeline and measurable budgets for pixel art, profile/equipment images, audio, animation JSON, fonts, and platform metadata.

**Why:** The app already bundles many high-resolution equipment PNGs and multiple WAV effects. Uncontrolled asset growth increases install/update size, memory use, load time, and Metro/EAS build cost.

**Scope:**
- Asset inventory with file size, dimensions, alpha, format, and usage
- Per-category and total bundle budgets
- Lossless/pixel-safe image optimization and appropriate audio encoding
- Duplicate/orphan detection and centralized asset registration
- Deferred mounting/preloading rules for non-critical art/audio
- Bundle-size reporting in CI and release review

---

## Delivery Blueprint — Phase 5 — Celebration, Inventory, and Sync Polish

### <a id="blueprint-feature-44"></a>Feature #44 — Asset Optimization and Bundle Budgets

**Inventory and tooling**

- Add a repository script that inventories registered and unregistered assets with path, type, bytes, dimensions/duration, alpha, and reference count.
- Fail or warn on orphaned assets, duplicate hashes, oversized source dimensions, unsupported formats, and direct component-level `require()` calls outside the central registries.
- Record baseline native/web export sizes and set reviewed budgets per category: critical UI, avatars/Lory, equipment, audio, animations, and fonts.
- Generate a human-readable asset report in CI; require an explicit budget update when growth is intentional.

**Images**

- Preserve transparent PNG and crisp nearest-neighbor/pixel-art behavior where it matters. Evaluate lossless WebP/optimized PNG per asset on actual Expo platforms instead of blanket format conversion.
- Resize source art near its maximum rendered density; do not ship multi-megapixel transparent images for 44-pixel icons.
- Keep platform icons, adaptive icon, splash, favicon, and social/marketing images in their required color-space/alpha formats.
- Continue registering reusable art in `src/constants/images.tsx`; deferred screens mount heavy galleries only when needed.

**Audio and animation**

- Trim leading/trailing silence and normalize all SFX. Keep short latency-sensitive effects small WAVs; encode longer fanfares/music more efficiently.
- Validate Lottie JSON/image dependencies and remove unused layers/metadata where safe.
- Preload only critical Home/button audio. Defer rare celebration sounds and non-visible catalogs without causing first-use freezes.

**Runtime verification**

- Profile memory and first-render behavior on a low-end Android device, not only bundle bytes.
- Verify transparency, full composition, pixel edges, dark-mode backgrounds, audio latency, and no missing assets in release-mode builds.
- Run Expo export/build smoke checks after asset-registry changes and track compressed download/install size across releases.

---
