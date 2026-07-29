# Loro - Gamified Habits Agent Guide

This file contains the mandatory workflow for agents working in this repository. Keep it concise and stable. Product rules, engineering architecture, and roadmap history belong in the linked documents rather than being duplicated here.

## Documentation Map

| Document | Canonical responsibility |
|----------|--------------------------|
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Product concept, game-loop rules, terminology, Lory voice, UX boundaries, and visual direction |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Current stack, data ownership, client/backend boundaries, security, persistence, testing, and Definition of Done |
| [`docs/PLANS.md`](docs/PLANS.md) | Feature priority, status, implementation blueprints, dependencies, and technical debt |
| [`docs/history/README.md`](docs/history/README.md) | Monthly implementation history, significant decisions, verification, and follow-up records |
| Source code, tests, migrations, deployed configuration | Final truth for current implementation behavior |

### Required reading by task

- **Feature implementation:** Read the feature's matrix entry, detail, blueprint, dependencies, and conflicts in `docs/PLANS.md`; then read the relevant product and architecture sections.
- **Game-rule or UX change:** Read `docs/PRODUCT.md` and the related roadmap feature before editing.
- **State, persistence, Supabase, auth, AI, security, or delivery work:** Read the relevant sections of `docs/ARCHITECTURE.md`.
- **Bug fix or diagnosis:** Inspect the current code and tests first. Consult the roadmap when the behavior is feature-specific, but do not assume planned behavior is implemented.
- **Library, framework, SDK, API, CLI, cloud service, or plugin work:** Follow the external-documentation procedure below.

Reference shared information instead of copying it into multiple documents. If current source code contradicts documentation, treat code/migrations/tests as implementation truth, explain the mismatch, and update the appropriate canonical document as part of the task.

## Communication and Confidence

- Use detailed, evidence-based explanations.
- Before making changes, state the plan and material assumptions.
- During long tasks, provide concise milestone updates.
- Do not expose private chain-of-thought; provide conclusions, evidence, tradeoffs, and verification instead.
- Do not make changes until there is at least 95% confidence in the requested outcome. Inspect discoverable context first and ask focused follow-up questions only when a reasonable assumption would materially change the result.
- Avoid unrelated refactors and preserve unrelated working-tree changes.
- Explain the files changed, behavior added or fixed, why the implementation was selected, how it works, tests run, limitations, and follow-up considerations.

## Product Guardrails

The complete product contract is in `docs/PRODUCT.md`. The following rules are mandatory during ordinary implementation:

- Protect the loop: choose a habit → complete one clear quest → receive feedback → advance the trail.
- Keep Daily Quests to one primary hold or tap action. Optional notes/details occur after completion.
- Missing a day never removes earned Adventure Path progress.
- Timed quests consume energy; one-time Water, Sleep, and Outdoors remain usable at zero energy.
- Preserve the five primary tabs: Profile, Stash, Home, Guild, and More. New destinations normally live inside the closest tab.
- Use Lory's canonical Trail Captain art and concise, friendly, non-guilt-based voice.
- AI may phrase app-provided facts but must not calculate rewards, eligibility, streak risk, or game mutations.
- Real-money features must not sell gameplay advantage.
- Social features must be opt-in and privacy-preserving.

## Core Engineering Guardrails

The complete engineering contract is in `docs/ARCHITECTURE.md`.

- Use strict TypeScript and the existing Context/repository architecture.
- Screens express intent; they do not calculate or patch authoritative rewards, coins, XP, energy, streaks, loot, inventory, or purchases.
- Durable authenticated mutations use authorized, validated, transactional, retry-safe Supabase RPCs or authenticated Edge Functions.
- Implement equivalent behavior in `localGameRepository.ts` for guests.
- Return typed outcomes and refreshed state; use semantic events rather than diffing snapshots for celebrations.
- Store durable facts and derive active/done/locked/progress/effective-streak state through pure utilities.
- Keep the main game snapshot compact. Use focused paged read models for growing statistics, activity, Guild history, catalog, and social data.
- Never put provider secrets, service-role keys, database passwords, OAuth secrets, or webhook credentials in `EXPO_PUBLIC_*`.
- Preserve RLS, explicit grants/revokes, ownership checks, generated database types, and pgTAP coverage for schema work.
- Use local `YYYY-MM-DD` date keys for once-per-day rules and ISO timestamps for durable events.
- Consolidate timezone/date logic rather than recreating it in screens.
- Respect accessibility, large text, safe areas, disabled/error/offline states, and reduced motion.
- Add comments only for non-obvious invariants or platform constraints. Explain why the constraint exists rather than restating the code.

## Supabase Migration History and Multi-Agent Coordination

Migration filenames and the remote `supabase_migrations.schema_migrations` history are separate sources of truth. A remote schema can contain a change whose original migration file is absent from this checkout, and a local file can be present without having been applied remotely. Treat that divergence as a deployment blocker until it is reconciled deliberately.

- Only one designated agent may repair remote migration history or run a mutating linked-database command at a time. Other agents may inspect migrations and the linked schema read-only, but must not run `supabase migration repair`, `supabase db push`, `supabase db reset` against a shared remote, or equivalent commands concurrently. Announce the migration owner and the version range being handled in the task commentary before making the change.
- Before creating, repairing, or pushing migrations, inspect the worktree and the complete migration matrix:
  - `git status --short`
  - `supabase migration list`
  - `supabase db push --dry-run`
  Never assume that another agent's migration file has been committed or that a remote deployment completed just because the code is present locally.
- Do not edit, rename, delete, or reorder a migration that may already be applied in any environment. Create a forward migration with `supabase migration new <descriptive-name>` for corrections. Preserve the migration's transaction boundaries, `security definer`/empty `search_path` settings, ownership, explicit grants/revokes, RLS, and idempotency guarantees.
- A `[missing local]` remote version is not permission to mark it reverted. First inspect the linked schema read-only (`supabase db dump --linked` or an equivalent approved read-only query) and the checked-in migrations. Map the remote version to an exact local migration or to a demonstrably identical set of schema/data/function/policy changes. Compare object definitions, columns, constraints, indexes, policies, grants, function bodies, and relevant catalog data—not just names or timestamps.
- If no exact local equivalent can be proven, stop and request direction. Do not use `--include-all`, force flags, a blind `db pull`, or a guessed repair to make `db push` proceed. Preserve the unknown remote version and escalate the mismatch instead of hiding it.
- When an exact equivalence is proven, repair history in an auditable order: mark the unknown remote alias `reverted`, mark the checked-in equivalent migration `applied`, then run `supabase db push --dry-run` again. The dry run must list only genuinely unapplied forward migrations; if it would replay existing DDL/data or omit an expected migration, stop and investigate before pushing.
- Never mark a local migration `applied` merely because a similarly named table exists. This is safe only when the full behavior is already present and the repair record names the remote version, local version, evidence inspected, and any limitations. Keep a factual entry in `docs/history/YYYY-MM.md` for non-trivial history repairs.
- Push only the verified pending set, with explicit authorization for the shared remote. Afterward verify all of the following:
  - `supabase migration list` has matching local and remote versions with no missing rows.
  - `supabase db push --dry-run` reports that the remote database is up to date.
  - A read-only deployed-schema check confirms critical RPC/snapshot response fields and security properties.
  - `npm run supabase:reset`, `npm run supabase:test`, `npm run supabase:lint`, `npm run supabase:types`, and `npm run typecheck` are run when the change affects local schema, generated types, or client contracts.
- Preserve unrelated agent work. Remote repair must not be bundled with a worktree reset or cleanup, and temporary schema dumps must be written outside the repository and removed after inspection.

## External Library and Platform Documentation

Use the `context7-mcp` skill and Context7 MCP whenever work depends on an external library, framework, SDK, API, CLI, cloud service, or plugin. This includes Expo, React, React Native, Supabase, NativeWind, Tailwind, Reanimated, SecureStore, SQLite, Linking, Network, Ionicons, and newly introduced dependencies.

Context7 is not required for local business logic, visual design decisions, asset work, straightforward refactoring, or code review that does not depend on external API behavior.

Procedure:

1. Call `resolve-library-id` with the library name and full task unless an exact `/org/project` or versioned ID is already supplied.
2. Select the closest official source by exact match, task relevance, version compatibility, source reputation, snippet coverage, and benchmark quality.
3. Call `query-docs` with the selected ID and a focused version of the user's full question.
4. Use separate queries for distinct concepts such as authentication, notifications, migrations, caching, or deployment.
5. Check both required syntax and current recommended practices.
6. Apply guidance that is compatible with versions installed in this repository.
7. If Context7 is unavailable or has no suitable source, say so and use the vendor's official primary documentation.

## Commands

- `npm run start` — start Expo.
- `npm run android` — start Expo and open Android.
- `npm run ios` — start Expo and open iOS.
- `npm run web` — start Expo web.
- `npm run typecheck` — run strict TypeScript verification; required after code changes.
- `npm run supabase:start` — start the local Supabase stack.
- `npm run supabase:reset` — apply local migrations and seed data from a clean database.
- `npm run supabase:test` — run local pgTAP database tests.
- `npm run supabase:types` — regenerate local database TypeScript types.
- `npm run supabase:lint` — lint the local database.
- `npm run supabase:push:dry` — preview linked-project migration changes.
- `npx expo install --check` — verify Expo dependency compatibility.
- `npx expo-doctor` — run broader Expo diagnostics.

Prefer `npx expo install <package>` for Expo-managed dependencies. Do not use `--force` or `--legacy-peer-deps` as a routine dependency fix.

## Expo Automation Port Policy

- Port `8081` is reserved for the user's manual Expo development server and physical-phone testing.
- Automated Expo/Metro testing must use explicit port `8082`, for example `npx expo start --android --port 8082`.
- If `8082` is occupied, use `8083` or a higher explicit automation port.
- Never stop, reuse, take over, or interactively reassign the manual server on `8081`.
- Stop only the Expo/Metro process started by the current automated test.

Prefer Expo Go first. Use a development build only when a dependency or native capability requires it.

## Code and File Conventions

- Use NativeWind semantic class names for normal component styling.
- Keep shared visual tokens in `src/constants/themeTokens.js`; use `src/constants/colors.ts` only for runtime APIs that cannot consume class names.
- Register reusable images in `src/constants/images.tsx` and shared sounds through the audio constants/provider.
- Use Ionicons instead of handwritten SVG icons when an appropriate icon exists.
- Reusable cross-screen UI belongs in `src/components/`; meaningful screen-local composition may remain with the screen.
- Pure domain calculations belong in `src/utility/`.
- Remote calls, response parsing, and caches belong in `src/services/`.
- Shared contracts belong in `src/types/`; avoid `any` and use `import type`.
- Use PascalCase for component files/exports, camelCase for values/functions, `.tsx` only for JSX, and `.ts` for TypeScript logic.
- Keep components focused. Extract shared code when it is reused or owns meaningful behavior; do not add wrappers that only rename a `View`.
- Keep `App.tsx` thin and preserve the existing provider/navigation structure.
- Do not add speculative directories, state libraries, routing layers, or dependencies.
- Preserve approved pixel art, transparency, and complete image bounds.
- Avoid unrelated code formatting or refactoring in focused changes.

## Expo Dependency Constraints

- Keep packages compatible with Expo SDK 54.
- Do not independently upgrade React Native, React, Reanimated, Worklets, or `@types/react` outside the Expo compatibility set.
- Keep `babel-preset-expo`, the NativeWind JSX import source/transform, and the NativeWind-wrapped Metro configuration intact.
- Clear Metro's cache after dependency/configuration changes before diagnosing a native runtime mismatch.

## Verification

Select verification in proportion to the change and follow the full matrix in `docs/ARCHITECTURE.md`.

For every code change:

1. Run `npm run typecheck`.
2. Exercise the affected screen on a mobile-sized viewport or device.
3. Check loading, error, disabled, and empty states where applicable.
4. Check large-text overflow, safe areas, persistent tab usability, and image bounds.
5. Verify accessibility and reduced-motion behavior for changed interactions.

For game-state changes, also verify:

1. New-player initial state.
2. Timed-quest duration enforcement.
3. Zero-energy one-time quests.
4. Once-per-habit-per-date completion.
5. Once-per-date app-wide streak advancement.
6. Atomic rewards, XP, activity, streak, Guild, loot, and path updates.
7. Chapter reward eligibility and idempotency.
8. Authenticated/guest parity.
9. Duplicate retry and concurrency safety.

For Supabase changes:

1. Apply/reset local migrations.
2. Run database lint and pgTAP/RLS tests.
3. Verify ownership and cross-user denial.
4. Regenerate database types.
5. Run TypeScript verification.

Documentation-only changes do not require application typechecking unless they change executable examples or configuration. Validate links, anchors, Markdown structure, and diff scope instead.

## Roadmap Workflow

`docs/PLANS.md` is the canonical feature register.

### Before implementing a feature

1. Read its Priority Matrix entry and confirm the current status.
2. Read its Feature Details and Delivery Blueprint.
3. Review dependencies, conflicts, product rules, and architecture requirements.
4. Audit current code and migrations; do not rely on roadmap status alone.
5. Confirm the requested change does not duplicate or contradict another feature.

### After completing a feature or significant change

1. Update the status in the Priority Matrix.
2. Update the document's `Last updated` date.
3. Update feature notes when implementation differs from the plan.
4. Mark implemented details with `✅` while preserving original intent where historically useful.
5. Append a factual, concise entry to the applicable `docs/history/YYYY-MM.md` archive containing:
   - Behavior implemented
   - Files changed
   - Key design decisions
   - Verification performed
   - Remaining limitations or follow-up work
6. When creating a new monthly archive, add it to `docs/history/README.md` and follow the archive template.
7. Add newly discovered roadmap features with a priority, effort, impact, dependencies, and a delivery blueprint.

Do not remove completed features from the matrix. Preserve stable feature IDs and historical references. If a roadmap idea is replaced, record the replacement rather than erasing the earlier decision.

## Output Expectations

When handing off implementation work, explain:

- What files or components changed
- What behavior was added or fixed
- Why this implementation fits the product and architecture
- How important or non-obvious logic works
- What verification or tests ran
- What was not tested and why
- Remaining limitations or recommended follow-up

Keep explanations appropriate to the task's complexity, but do not omit material risks or verification results.
