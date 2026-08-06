# Feature #25 - IKEA-Effect Onboarding (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-25)

### <a id="feature-25"></a>25. IKEA-Effect Onboarding (P3)

**Status: Complete**

**What:** Sequential onboarding that lets a new user personalize a trail before choosing an account or local guest mode.

**Implemented flow:**

1. Signed-out landing offers **Get Started** or **I already have an account**.
2. The catalog-driven habit selector accepts any number of available habits; all six current habits are selectable and future catalog entries do not introduce a fixed ceiling.
3. A one-time introductory quest shows the selected habit's real first-node target, uses the existing audio long-press interaction, and awards a fixed bounded `+10 XP`, `+10 coins`, and `+1 shield` celebration without changing normal energy, streaks, loot, or quest history.
4. A trail-ready screen offers **Create an account** or **Continue as a guest**.
5. Guest mode requires an accessible confirmation modal explaining retained local data and account limitations.
6. Direct signup carries onboarding state without a migration warning. Later guest signup shows a bounded migration warning before account creation.
7. ✅ Selecting **Create an account** from the completed onboarding state opens signup directly; the persisted import retains the exact valid selection and order—whether that is a subset such as two or four habits, all six current habits, or a future supported count—plus the bounded starter reward through verification.
8. ✅ Email-verification session creation and cold-start session restoration keep the signed-in app gate closed until the onboarding import commits, so the first authenticated snapshot cannot replace the exact onboarding selection with catalog defaults.
9. ✅ The habit-selection screen now follows the compact reference layout: a blue-to-white canvas, centered progress/title/count hierarchy, color-coded icon tiles, outlined selected cards, and a right-arrow primary action while retaining catalog-driven selection and responsive scrolling.

**Persistence and safety:**

- ✅ `OnboardingSession` is persisted in platform storage through interrupted onboarding and email verification.
- ✅ `enabledHabitIds` is part of the shared app state; selectors consume the enabled list rather than a second fixed list.
- ✅ `user_habit_preferences` stores ordered server preferences with RLS and authenticated-only access.
- ✅ `complete_guest_onboarding` validates catalog IDs, writes preferences, records one import per account, and is retry-safe.
- ✅ The introductory reward is persisted in guest state and granted server-side exactly once for verified imports; the RPC owns the fixed reward values and returns them as typed outcome data.
- ✅ Guest cache remains intact until the authenticated import succeeds. Arbitrary coins, XP, streaks, shields, loot, inventory, and history are not imported.
- ✅ Generated onboarding illustrations are registered centrally and use the existing Loro pixel-art direction.

## Delivery Blueprint — Phase 3 — Long-Term Engagement and Compassionate Retention

### <a id="blueprint-feature-25"></a>Feature #25 — IKEA-Effect Guest-to-Account Funnel

**Product flow**

- Let a new user choose any number of catalog habits, personalize the first trail, and complete one bounded introductory quest before the save-progress account prompt.
- Keep “I already have an account” available from the first screen.
- The signup value proposition is persistence and sync, not a threat that progress will disappear immediately.

**Habit-selection model**

- Keep habit definitions in the catalog and persist ordered user preferences (`enabled`, `sort_order`) rather than deleting habits from `AppState`.
- Expose `enabledHabitIds` so Home, Guild metrics, Lory context, notifications, stats, and all-trails-complete selectors use the selected set.
- Existing users default to all currently available habits until they choose otherwise.
- The forward preference migration and its prerequisites are applied to the linked Supabase project, so authenticated refreshes return the committed enabled set and order.
- ✅ More’s Habit Targets card is the on-demand preference editor: checkboxes change the enabled set and arrows persist its order, which is immediately reflected by Home’s selector and active-habit fallback.

**Safe progress conversion**

- Client-owned guest state is untrusted. Do not insert arbitrary guest coins, XP, loot, streaks, timestamps, or completions into production tables.
- Generate a client import ID and call idempotent `complete_guest_onboarding` after signup. The server accepts only selected habit IDs and the bounded onboarding result.
- The RPC initializes preferences and grants no client-controlled economy reward. The unique account/import ledger prevents retry duplication.
- Keep the guest cache until server import succeeds; an existing-account login does not merge automatically.

**Client architecture and verification**

- ✅ Root funnel state stays before the existing Auth screen; onboarding remains outside the main game reducer until the guest or authenticated provider starts.
- ✅ Verify skip/back/relaunch, no-selection validation, all-current-habit selection, future-catalog utility behavior, signup success/failure/retry, existing-account login, duplicate/malicious import payloads, cache retention, RLS, and cross-platform storage.
- ✅ After onboarding completion, logout returns to the existing login page; the login page's guest action can resume the same persisted guest cache without reopening onboarding.
