# Feature #28 - Customize Habit Settings (P1)

> Roadmap index: [PLANS.md](../PLANS.md#feature-28)

### <a id="feature-28"></a>28. Customize Habit Settings (P1)

**What:** Let users adjust the target duration (timed habits) or target count (one-time habits) per habit, without changing quest types. Stock values serve as minimums.

**Why:** User-requested. Six fixed targets won't fit everyone's routine (e.g., "I exercise for 30 minutes, not 15"). This replaces the original #28 (Custom Habit Creation) which was P3 — customizing existing habits is lower effort and higher immediate value. Full custom habit creation may return in a future P3 iteration.

**Constraints:**
- **Type lock:** `timed` habits stay timed; `one-time` habits stay one-time. No converting Water into a timed quest — this would break energy cost assumptions and path structure.
- **Minimum floor:** Timed = 5 minutes, one-time = 1 unit. Stock values are the floor.
- **Per-habit override** is stored in `AppState.targetOverrides` and `user_settings.target_overrides`, falling back to the active node's chapter blueprint.

**Examples:**
| Habit | Default | User Sets |
|-------|---------|-----------|
| Exercise | 15 min | 30 min |
| Reading | 10 min | 20 min |
| Water | 6 glasses | 8 glasses |

**Implementation notes (partially built):**
- ✅ Add `targetOverrides: Partial<Record<HabitId, number>>` to `AppState` and the persisted game snapshot.
- Add a settings row per habit in the Settings UI (More tab, #8)
- Display: habit icon + label + stepper/slider for the override value
- Shared `getEffectiveHabitTarget()` and `getDailyQuestSummary()` derive the Home display and local enforcement from the persisted override.
- No path migration needed — overrides only affect quest completion requirements, not adventure path structure
- This is distinct from the original #28 (custom habit creation) which would create entirely new habits with generated paths
- ✅ The current implementation contains client display/enforcement, local timed-quest enforcement, a Supabase `target_overrides` migration, validated server persistence, a shared effective-target/summary utility, and More controls.
- ⚠️ One-time quests are still binary actions, so changing a displayed count does not verify that quantity. For the first complete version, either support timed-duration overrides only or add an explicit quantity-tracking interaction as a separate product change.
- ✅ Target changes now use the normal mutation path, hydrate Home from the returned snapshot, roll back failed optimistic updates, and validate allowed habit IDs/ranges inside the settings RPC.

---

## Delivery Blueprint — Phase 1 — Complete the P1 Core Experience

### <a id="blueprint-feature-28"></a>Feature #28 — Habit Target Customization

**Reviewed v1 scope**

- Ship timed-habit duration overrides first. Timed quests have a measurable server-enforced duration and fit the current interaction model.
- Keep one-time habits binary in v1. A displayed target count is informational unless the product intentionally adds counters or evidence; do not claim that “6 glasses” was technically verified by one tap.
- Use sensible per-habit minimums and maximums, not only a global minimum. Long values must remain practical for the timer and UI.

**Client and domain**

- Replace the current `Partial<AppSettings>` cast with a dedicated `HabitTargetOverrides` contract and intent such as `updateHabitTarget(habitId, target)`.
- Store a local draft while the user taps +/-; save once after confirmation or debounce with cancellation so out-of-order responses cannot overwrite the latest value.
- Derive effective quest details through one pure utility used by Home, Daily Quest, Adventure Path, Lory context, and local completion validation.
- Display “Default” explicitly rather than relying only on an asterisk.
- ✅ The More-tab Habit Targets card now owns enabled-habit selection: each catalog habit can be checked or unchecked on demand, with a guard that keeps at least one habit enabled.
- ✅ The same card exposes accessible up/down controls for enabled-habit ordering; Home and other habit consumers read the shared ordered `habitList` instead of maintaining a second order.

**Backend and data**

- A dedicated RPC validates the habit exists, the habit is timed, the integer is within that habit's allowed range, and `null` means restore default.
- If JSONB remains the storage format, validate every key/value before saving. A normalized `user_habit_settings` table is preferable once more per-habit settings are added.
- `complete_daily_quest` must use the same effective-target rule as the snapshot/read model. Do not duplicate divergent clamping logic across migrations.
- Add authenticated and guest parity tests, including timer started before an override change; define whether the started quest snapshots its original target or uses the latest target. Recommended: snapshot the target at quest start.
- ✅ `update_settings` now accepts an ordered, non-empty `enabledHabitIds` list, validates IDs against the server catalog, and persists the preference order transactionally for authenticated users; the local repository applies the same validation and rollback behavior for guests.
