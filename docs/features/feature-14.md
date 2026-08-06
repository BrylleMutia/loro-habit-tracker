# Feature #14 - Onboarding Guided Tour (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-14)

### <a id="feature-14"></a>14. Onboarding Guided Tour (P2)

**What:** First-time user walkthrough introducing Lory, the game loop, streaks, energy, and quest types.

**Why:** New users may not understand timed vs one-time quests, energy costs, or how adventure paths work. A guided tour reduces drop-off.

**Flow:**
1. Lory greets: "Welcome, adventurer! I'm Lory, your trail captain. 🦜"
2. "These are your daily quests — complete them to advance on the adventure path."
3. "Timed quests use energy. Hold the button to start!" (demo on Exercise)
4. "One-time quests like Water don't need energy. Just tap!"
5. "Consistency builds your trail. Missing a day never removes the progress you've earned."
6. "Check in daily for bonus coins and energy."

**Implementation notes:**
- New component `OnboardingTour` with step-by-step overlays
- Tooltip-style highlights pointing at UI elements
- Stored `hasCompletedOnboarding: boolean` in settings or profile
- Skip button always visible
- Can be re-triggered from More → "Replay tutorial"

---

## Delivery Blueprint — Phase 2 — Retention, Progression, and Core Polish

### <a id="blueprint-feature-14"></a>Feature #14 — Guided Onboarding

**Product flow**

- Split onboarding into a short conceptual introduction and contextual coach marks. Do not force users through a long six-step blocking modal before they can explore.
- Introduce only concepts needed for the next action: Daily Quest, hold/tap behavior, energy, path progress, and rewards. Explain Guild/Stash later when first opened.
- Skip is always visible; replay is available from Settings.
- Notification permission is a separate contextual step after explaining the benefit, not an unconditional onboarding prompt.

**Client architecture**

- Store `onboardingVersion`, not a boolean, so future essential steps can run without replaying the entire tour.
- Define typed steps in `src/constants/onboarding.ts` and keep presentation in reusable components.
- Prefer dedicated onboarding pages/cards for stable layout. Use measured coach-mark anchors only where pointing at live UI materially helps; handle missing/unmounted targets by falling back to a centered explanation.
- Keep current step and transient measurements local. Persist completion through `updateSettings` and guest cache.
- Add analytics events for shown, skipped, completed, and step drop-off without attaching personal habit details.

**Verification**

- Test new/returning users, guest/authenticated, skip/replay, interrupted app, screen rotation/resizing, large text, screen reader order, missing target, and onboarding-version migration.
