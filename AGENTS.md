# Loro - Gamified Habits Agent Guide

This file contains the repository-wide workflow, safety rules, and documentation-routing rules. Read only the task-relevant documents linked below; do not recursively load `/docs` for ordinary work.

## Documentation map and routing

| Document | Use for |
|----------|---------|
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Product concept, game rules, terminology, Lory voice, UX boundaries, and visual direction |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, state/data ownership, security, persistence, testing, delivery, and migration procedures |
| [`docs/PLANS.md`](docs/PLANS.md) | Compact feature priority/status index and roadmap routing |
| [`docs/features/feature-XX.md`](docs/features/) | One feature's scope, implementation notes, dependencies, and delivery blueprint |
| [`docs/decisions/`](docs/decisions/) | Focused product or engineering decision records; read only the applicable record |
| [`docs/history/README.md`](docs/history/README.md) | Monthly implementation history; read history only for historical/documentation work or explicit user requests |
| Source code, tests, migrations, generated types, deployed configuration | Final truth for current implementation behavior |

Task routing:

- **Feature implementation:** Read the matrix row in `docs/PLANS.md`, exactly one matching feature contract, and only relevant product/architecture sections.
- **Game-rule or UX change:** Read `docs/PRODUCT.md` and the relevant feature contract.
- **State, persistence, Supabase, auth, AI, security, or delivery work:** Read only the relevant sections of `docs/ARCHITECTURE.md` and the related feature/decision file.
- **Bug fix or diagnosis:** Inspect current code and tests first. Consult the roadmap only when behavior is feature-specific.
- **History or documentation audit:** Read only the necessary decision or monthly-history file.
- Do not load every file under `docs/features/`, `docs/decisions/`, or `docs/history/` for an ordinary task.

## Communication and confidence

- State the plan and material assumptions before making changes.
- Give concise milestone updates during long tasks.
- Report conclusions, evidence, tradeoffs, verification, limitations, and follow-up work; do not expose private chain-of-thought.
- Inspect discoverable context before asking questions. Do not make changes until the requested outcome is sufficiently clear.
- Preserve unrelated working-tree changes.

## Product guardrails

The complete product contract is in [`docs/PRODUCT.md`](docs/PRODUCT.md). Preserve these invariants:

- Protect the loop: choose a habit → complete one clear quest → receive feedback → advance the trail.
- Daily Quests use one primary hold or tap action; optional notes/details occur after completion.
- Missing a day never removes earned Adventure Path progress.
- Timed quests consume energy; one-time Water, Sleep, and Outdoors remain usable at zero energy.
- Preserve the five primary tabs: Profile, Stash, Home, Guild, and More.
- Use canonical Trail Captain art and concise, friendly, non-guilt-based Lory voice.
- AI may phrase app-provided facts but must not calculate rewards, eligibility, streak risk, or game mutations.
- Real-money features must not sell gameplay advantage; social features must be opt-in and privacy-preserving.

## Engineering guardrails

The complete engineering contract is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

- Use strict TypeScript and the existing Context/repository architecture.
- Screens express intent; repositories and authorized server mutations own authoritative rewards, coins, XP, energy, streaks, loot, inventory, and purchases.
- Durable authenticated mutations use validated, transactional, retry-safe Supabase RPCs or authenticated Edge Functions.
- Implement equivalent behavior in `localGameRepository.ts` for guests.
- Return typed outcomes and refreshed state; use semantic events for celebrations.
- Store durable facts and derive active/done/locked/progress/effective-streak state through pure utilities.
- Keep the main snapshot compact and use focused paged read models for growing statistics, activity, Guild history, catalog, and social data.
- Never put provider secrets, service-role keys, database passwords, OAuth secrets, or webhook credentials in `EXPO_PUBLIC_*`.
- Preserve RLS, explicit grants/revokes, ownership checks, generated database types, and pgTAP coverage for schema work.
- Use local `YYYY-MM-DD` date keys for once-per-day rules and ISO timestamps for durable events.
- Respect accessibility, large text, safe areas, loading/error/offline states, and reduced motion.

## Supabase migration safety

- Only one designated agent may repair remote migration history or run a mutating linked-database command at a time. Announce the owner and version range before changing a shared remote.
- Before migration creation, repair, or push, inspect `git status --short`, `supabase migration list`, and `supabase db push --dry-run`.
- Never edit, rename, delete, or reorder a migration that may already be applied. Use a forward migration for corrections.
- A missing local remote version is not permission to repair history. Inspect the linked schema and local migrations and compare definitions, policies, grants, functions, constraints, and relevant data.
- If exact equivalence cannot be proven, stop and request direction. Do not use blind pulls, force flags, `--include-all`, or guessed repairs.
- Repair only proven equivalence in an auditable order, rerun the dry run, and push only the verified pending set with explicit authorization.
- Afterward verify matching migration history, an up-to-date dry run, deployed RPC/snapshot/security properties, and the applicable database/type tests.

Detailed migration evidence and verification procedures live in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md); history records remain under `docs/history/` and are not routine task context.

## External libraries and platforms

Use the `context7-mcp` skill and Context7 MCP for library, framework, SDK, API, CLI, cloud-service, or plugin work, including Expo, React Native, Supabase, NativeWind, Reanimated, SecureStore, SQLite, Linking, Network, and Ionicons.

1. Resolve the library ID with the full task unless an exact `/org/project` ID is supplied.
2. Select the closest official, version-compatible source.
3. Query the focused concept; use separate queries for distinct concepts.
4. Apply current guidance compatible with installed versions.
5. If Context7 is unavailable, use official primary documentation and state the limitation.

Context7 is not required for local business logic, visual design, asset work, straightforward refactoring, or code review without external API behavior.

## Commands and Expo policy

- `npm run start` — start Expo.
- `npm run typecheck` — strict TypeScript verification.
- `npm run test:local` — local utility/service tests.
- `npm run supabase:start`, `supabase:reset`, `supabase:test`, `supabase:lint`, `supabase:types` — local database workflow.
- `npm run supabase:push:dry` — preview linked-project changes; push only when authorized.
- `npm run docs:check` — validate documentation links, anchors, roadmap parity, and footprint.

Port `8081` is reserved for the user's manual Expo server and physical-phone testing. Automated Expo/Metro testing must use explicit port `8082`, then `8083` or higher if occupied. Stop only the process started by the current automated test.

Prefer Expo Go. Use a development build only when a dependency or native capability requires it. Keep dependencies compatible with Expo SDK 54; do not independently upgrade React Native, React, Reanimated, Worklets, or `@types/react` outside the Expo compatibility set.

## Code and file conventions

- Use NativeWind semantic classes for normal styling and shared visual tokens in `src/constants/themeTokens.js`.
- Use Ionicons for suitable interface icons and register reusable images/audio centrally.
- Put reusable cross-screen UI in `src/components/`, pure domain calculations in `src/utility/`, remote calls/caches in `src/services/`, and shared contracts in `src/types/`.
- Use PascalCase for components, camelCase for values/functions, `.tsx` for JSX, and `.ts` for logic.
- Keep `App.tsx` thin, components focused, and the approved pixel art/transparency/image bounds intact.
- Do not add speculative directories, state libraries, routing layers, or dependencies.
- Add comments only for non-obvious invariants or platform constraints.

## Verification

For every code change:

1. Run `npm run typecheck`.
2. Exercise the affected screen at a mobile-sized viewport or device.
3. Check loading, error, disabled, empty, large-text, safe-area, accessibility, and reduced-motion behavior as applicable.

For game-state changes, also verify new-player state, duration enforcement, zero-energy one-time quests, once-per-date rules, atomic rewards/progression, chapter idempotency, guest/auth parity, retry behavior, and concurrency safety.

For Supabase changes, apply/reset local migrations, run lint and pgTAP/RLS tests, verify ownership and cross-user denial, regenerate types, and run TypeScript verification.

Documentation-only changes require `npm run docs:check`, link/anchor validation, footprint comparison, and `git diff --check`; application typechecking is unnecessary unless executable configuration changes.

## Roadmap workflow

Before a feature:

1. Read its priority/status row in `docs/PLANS.md`.
2. Read `docs/features/feature-XX.md` for that feature only.
3. Review relevant product and architecture sections and only applicable decision records.
4. Audit current code and migrations; do not rely on planned behavior alone.

After a feature or significant documentation change:

1. Update the status in `docs/PLANS.md`.
2. Update implementation details in the matching feature contract.
3. Update an applicable decision record if the decision changed.
4. Add a factual entry to the current monthly history file when the change is significant.
5. Run the applicable verification and update the documentation footprint if routing changed.

Do not remove completed features from the matrix. Preserve stable IDs, historical references, and the feature #9 gap.

## Handoff expectations

Report changed files, behavior or documentation-routing changes, design rationale, important invariants, tests/checks run, untested areas, limitations, and recommended follow-up. Keep the handoff proportional to the task and do not omit material risks.
