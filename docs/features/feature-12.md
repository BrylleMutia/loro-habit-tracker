# Feature #12 - Level-Up Celebration Modal (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-12)

### <a id="feature-12"></a>12. Level-Up Celebration Modal (P2)

**What:** A distinct, simpler modal when the player gains a level, separate from the quest-complete loot drop modal.

**Why:** Currently XP is tracked and levels exist, but the only celebration is quest-complete. Leveling up should feel like an event too.

**Implementation notes:**
- ✅ Added reusable `NewUnlockCelebrationModal` with a queued app-shell presentation, reduced-motion handling, Lory-style confetti, new-level details, and a focused continuation action.
- ✅ Hydrated profile level increases enqueue the level-up celebration without firing from the initial hydration pass; loot and check-in modals temporarily retain priority so native modals do not stack.
- ✅ Chapter reward claims use the same modal component and queue a chapter-specific reward presentation.
- ☐ Persist `previousLevel`, `newLevel`, and `levelsGained` as typed mutation-outcome fields inside each authenticated XP transaction; the current UI observes the authoritative refreshed profile level until that contract is added.
- Note: distinct from the [chapter completion celebration](../features/feature-36.md#feature-36) — level-ups can happen mid-chapter; chapter completions are 7-day milestones

---

## Delivery Blueprint — Phase 2 — Retention, Progression, and Core Polish

### <a id="blueprint-feature-12"></a>Feature #12 — Level-Up Celebration

**Domain contract**

- Centralize the XP-to-level calculation in one server/private function and one matching pure guest utility with shared test vectors.
- Mutation outcomes include `previousLevel`, `newLevel`, and `levelsGained`. Support gaining more than one level from a large reward even if the current economy rarely allows it.
- Level-up is a durable result of XP mutation; the modal never applies level or stat changes.

**UI flow**

- Queue level-up after the reward that caused it and before final post-completion navigation. If chapter completion and achievement unlocks also occur, the coordinator uses a documented order and combines low-priority toasts.
- Use a focused `LevelUpCelebration` presentation with new level, any unlocked capability, Lory, one short sound, and heavy haptic when enabled.
- Do not invent “stat increases” unless the level system actually changes a durable stat.
- Reduced-motion mode uses an immediate fade/static composition without particles or repeated movement.

**Verification**

- Test no level-up, one level, multiple levels, chapter reward level-up, retry, modal queue order, sound/haptics disabled, and app backgrounding during the sequence.
