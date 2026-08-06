# Feature #4 - Streak Shield Mechanics (P1)

> Roadmap index: [PLANS.md](../PLANS.md#feature-4)

### <a id="feature-4"></a>4. Streak Shield Mechanics (P1)

**What:** Earn streak shields from chapter completions. Auto-consume one when a day is missed to preserve the streak. Visual indicator when a shield is protecting you.

**Why:** Inventory already has `streakShields: 0` and `ActiveBuff` types defined. This is the natural next step to make shields meaningful.

**Implementation notes (partially built):**
- ✅ Added `isStreakReset` helper in `src/utility/adventurePath.ts` to detect when a streak would reset (gap > 1 day or no prior completion).
- ✅ On chapter reward claim (`claimLocalChapterReward` in `src/services/localGameRepository.ts`), increments `inventory.streakShields` by 1.
- ✅ On quest completion (`completeLocalDailyQuest`), checks if either habit streak or daily streak would reset. If `streakShields > 0`, consumes exactly one shield and preserves both streaks (habit.streak + 1, dailyStreak + 1) instead of resetting to 1.
- ✅ Shield display: `src/components/ResourceBar.tsx` keeps an always-visible themed `shield-checkmark` counter in the Home resource deck, including a readable zero state before the first shield is earned.
- ✅ Shield display: `src/screens/profile/index.tsx` shows shield count next to the streak line in the profile header.
- ✅ Shield consumption is atomic — one shield protects all at-risk streaks for a single quest completion.
- ✅ **Authenticated parity is complete:** a forward migration now corrects the composed snapshot, increments shields only for newly accepted chapter claims, and applies the same local-date protected-streak rules in the quest RPC with row locks and idempotent duplicate outcomes.
- ✅ Quest outcomes expose typed `streakShieldConsumed` and `remainingStreakShields` fields on guest and authenticated paths, with malformed remote responses rejected.
- ✅ The daily quest celebration modal presents a compact “Streak protected” notice with the consumed shield and remaining count on the streak page; it does not imply adventure-path risk.
- ✅ pgTAP coverage verifies earning, snapshot parity, protected and unprotected completions, duplicate retries, transactionally consistent streak/resource records, and role grants.

---

## Delivery Blueprint — Phase 1 — Complete the P1 Core Experience

### <a id="blueprint-feature-4"></a>Feature #4 — Streak Shield Production Completion

**Product and UX**

- A chapter reward grants one shield after the reward transaction succeeds.
- On the first quest completed after a missed eligible day, one shield protects both the app-wide streak and any affected habit streaks for that completion.
- The quest celebration modal shows a “Streak protected” notice on its streak page with the consumed shield and remaining count. Do not imply that path progress was ever at risk.
- A shield cannot be manually consumed, purchased with real money, or applied retroactively after the protected completion.

**Client and domain**

- ✅ Keep `isStreakReset` and the guest rules in pure utilities/local repository, with focused native Node tests for same-day, consecutive-day, one-day gap, multi-day gap, null prior completion, and habit/daily-only risk cases.
- Extend `QuestCompletionOutcome` with `streakShieldConsumed: boolean` and `remainingStreakShields: number`; avoid inferring consumption by comparing cached snapshots.
- Pass the typed shield outcome into the quest celebration modal rather than rendering shield messaging directly inside `DailyQuestCard`.

**Backend and data**

- ✅ Correct `loro_private.build_game_snapshot` to emit `profiles.streak_shields`, not a hard-coded zero.
- ✅ Update `claim_chapter_reward` to lock the user's profile row and increment `streak_shields` atomically only when the chapter claim is newly inserted.
- ✅ Update `complete_daily_quest` to evaluate habit and daily streak resets using the user's local date, consume at most one shield, and update both streaks in the same transaction.
- ✅ Preserve idempotency: an already-completed quest or already-claimed chapter must not grant/consume another shield.
- ✅ Add pgTAP cases for remote earning, consumption, no-consumption, duplicate retry, and snapshot parity. Regenerate database types.

**Completion gate**

- Authenticated and guest users produce identical shield counts and streak outcomes for the same date sequence.
- Feature #5 must not ship a shield purchase until this gate passes.
