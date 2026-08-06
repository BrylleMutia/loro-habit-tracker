# Feature #43 - Launch Readiness: Observability, Security, QA, and Delivery (P1)

> Roadmap index: [PLANS.md](../PLANS.md#feature-43)

### <a id="feature-43"></a>43. Launch Readiness: Observability, Security, QA, and Delivery (P1)

**What:** Establish the production controls needed to operate Loro safely: crash/error visibility, privacy-conscious product analytics, automated verification, environment separation, migration/function deployment, security review, release checklists, and recovery procedures.

**Why:** Authentication, economy mutations, AI generation, notifications, social data, and payments cannot be operated responsibly with only manual typechecking. This feature is a prerequisite for public launch and should begin before the last feature sprint.

**Scope:**
- Global error boundary and native crash/error reporting
- Typed product analytics with explicit privacy allow-list
- Unit/component/integration/end-to-end test layers
- CI for TypeScript, Expo compatibility, unit tests, pgTAP/RLS, Edge Function tests, and bundle checks
- Development/staging/production environment and secret separation
- Supabase migration/Edge Function deployment workflow
- Dependency, RLS, authorization, account lifecycle, and AI data-flow security review
- Release, rollback, backup/restore, incident, and store-submission checklists

---

## Delivery Blueprint — Phase 0 — Production Foundations

### <a id="blueprint-feature-43"></a>Feature #43 — Launch Readiness

**Environment and delivery architecture**

- Maintain separate development/staging/production Supabase projects or branches with distinct publishable keys, server secrets, OAuth redirects, notification credentials, and billing webhooks.
- Add `eas.json` profiles for development client, internal preview, and production. Use remote app-version/build-number management and explicit update channels only after rollback policy is defined.
- Native features such as notifications, Google native auth, widgets, and RevenueCat are verified in development builds before production profiles.
- Store secrets in Supabase/EAS secret management; commit only templates and public configuration. Never keep store service-account files or provider secrets in the repository.
- Document deployment order: database migration → generated types/Edge Function deploy → client compatibility check → staged mobile build. Backward-compatible server changes land before clients that require them.

**Automated quality gates**

- Add scripts for unit tests, component/integration tests, Edge Function tests, and a deterministic web/native bundle smoke check.
- Pull requests run formatting/lint if adopted, `npm run typecheck`, unit/component tests, `npx expo install --check`, `npx expo-doctor`, Supabase local reset + pgTAP/RLS tests, generated-type drift, and asset-budget checks.
- Main/release workflows create internal builds first. Store submission remains an explicit gated step until release reliability is proven.
- When EAS Workflows are introduced, generate and validate workflow YAML against the current Expo workflow schema rather than relying on memorized job syntax.
- Block release on migration drift, failed RLS tests, uncommitted generated types, incompatible Expo packages, or bundle-budget regression.

**Observability**

- Add a global error boundary around the app shell with a branded recover/restart surface.
- Select one Expo-compatible crash/error service; tag app version, platform, route/tab, auth mode, sync status, and sanitized error code. Redact tokens, emails, notes, AI context/messages, and raw activity.
- Define typed analytics events in one module with an allow-list of low-sensitivity properties. Examples: quest started/completed, onboarding step, shop purchase result, notification permission result, and Lory cache outcome.
- Add server-side structured logging for Edge Functions and important RPC failure codes without logging secrets or complete request bodies.
- Create dashboards/alerts for auth failures, mutation error rate, Lory latency/failure, notification token invalidation, billing webhook failures, and crash-free sessions.

**Security and privacy gate**

- Audit every exposed table/function for grants, RLS ownership, `SECURITY DEFINER`, `search_path`, direct execution, indexes used by RLS, and BOLA/IDOR.
- Review account export/delete/reset, session revocation, OAuth redirect allow-lists, Edge Function authentication, DeepSeek data minimization, notification tokens, social privacy, and billing webhooks.
- Run dependency vulnerability/license review and independent code/security review. Treat automated scanners and LLM review as inputs, not proof.
- Document data categories, retention, processors, user controls, and privacy/store disclosures before public analytics, AI, social, or payments launch.

**Release operations**

- Maintain release, rollback, incident, backup/restore, and store-submission checklists.
- Test Supabase backup/restore and migration rollback/forward-fix on staging. Prefer forward fixes for production migrations containing user data.
- Roll out high-risk features with server-controlled flags and staged cohorts. A client-only flag is presentation control, not security.
- Define ownership for support triage, data-deletion requests, provider outages, and security incidents.

**Completion gate**

- A clean checkout can reproduce verification and an internal Android/iOS build from documented commands, staging migrations/functions are deployable in order, telemetry is privacy-reviewed, and one rollback drill has been completed.
