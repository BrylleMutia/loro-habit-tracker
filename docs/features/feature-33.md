# Feature #33 - Post-Completion Flow in Celebration Modal (P1)

> Roadmap index: [PLANS.md](../PLANS.md#feature-33)

### <a id="feature-33"></a>33. Post-Completion Flow in Celebration Modal (P1)

**What:** After the loot drop celebration, offer clear next-action choices instead of just closing the modal.

**Why:** Currently the modal shows rewards then dismisses. Adding "Continue to next trail", "View adventure path", and "Done for today" turns completion into a satisfying transition. Reduces friction for multi-habit days.

**CTA buttons after loot reveal:**
- **"Continue to next trail"** — switches to the next unfinished habit and closes the modal
- **"View adventure path"** — navigates to the adventure path for the completed habit
- **"Done for today"** — closes the modal, stays on current habit

**Implementation notes:**
- Extend `LootDropDetails` with a `nextUnfinishedHabitId` field
- Add action buttons below the streak display in `QuestCelebrationModal`
- "Continue to next trail" only appears when there are unfinished habits remaining

---

## Delivery Blueprint — Phase 1 — Complete the P1 Core Experience

### <a id="blueprint-feature-33"></a>Feature #33 — Post-Completion Continuation

**Product and UX**

- After rewards and streak feedback, present no more than three clear choices: Continue to next trail, View this path, or Done.
- Derive the next unfinished habit from the latest returned snapshot in stable `habitOrder`; do not persist `nextUnfinishedHabitId` as game state.
- When all available habits are complete, replace “Continue” with an “All trails cleared” acknowledgment and a calm rest message. No extra perfect-day currency is required.
- Preserve the completed habit when “View path” is selected.

**Client architecture**

- Add a `CelebrationCoordinator` owned near `AppNavigator` that queues quest loot, optional chapter/level/achievement events, item details, and final navigation actions.
- Keep `QuestCelebrationModal` presentational: it emits semantic callbacks and does not import navigation/context mutation logic.
- Navigation callbacks should use the existing `PersistentTabHost`/Home local-view APIs rather than introducing global route state.
- If a follow-up action becomes invalid because a newer snapshot completed another habit, recompute before executing.

**Verification and dependencies**

- Cover zero, one, and many unfinished habits; path-complete habits; completing the final habit; modal dismissal; Android back; reduced motion; and rapid repeat taps.
- Build the coordinator before Features #11, #12, #36, #40, and #41 to prevent conflicting overlays.
