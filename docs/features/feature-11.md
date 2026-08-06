# Feature #11 - Achievement / Badge System (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-11)

### <a id="feature-11"></a>11. Achievement / Badge System (P2)

**What:** Define milestone-based achievements that unlock badges on the Profile screen. Each badge grants a small coin reward when first earned.

**Why:** `profileBadges` is already defined and imported in Profile. This gives players long-term goals beyond daily streaks.

**Badge definitions (expand on existing 4):**
| Badge | Unlock Condition | Tone |
|-------|-----------------|------|
| 🧭 New Adventurer | Account created | primary |
| ✅ First Quest | Complete 1 quest | success |
| 🔥 Seven Day Spark | 7-day streak | danger |
| 🏆 Chapter Hero | Complete a full chapter | reward |
| 🦜 Lory's Friend | 30 daily check-ins | primary |
| ⚡ Energizer | Complete all habits in one day | reward |
| 💎 Collector | Own 20+ items | reward |
| 🗺️ Trail Master | Complete 3 chapters | reward |
| 🛡️ Iron Will | Use a streak shield | primary |
| ⭐ Legendary Find | Acquire a legendary item | reward |

**Implementation notes:**
- Expand `ProfileBadgeId` union in `constants/profile.ts`
- Add an idempotent `user_achievements` ledger for signed-in users and an equivalent local ledger for guests.
- Evaluate achievement grants inside the same server transaction as the triggering mutation; do not make reducer-only unlocks authoritative for authenticated users.
- Badge unlock shown as a mini celebration (non-blocking toast)
- Profile screen shows greyed-out locked badges

---

## Delivery Blueprint — Phase 2 — Retention, Progression, and Core Polish

### <a id="blueprint-feature-11"></a>Feature #11 — Achievement and Badge System

**Product and UX**

- Define 8–12 launch achievements with clear, deterministic criteria. Show progress where the denominator is meaningful and “secret” only when discovery adds value.
- Locked badges remain legible and explain their condition; earned badges show earned date and any one-time reward.
- Unlock feedback is a short queued toast/celebration and never blocks the quest loot sequence.
- Keep rewards modest and bounded so achievements do not destabilize the coin economy.

**Client and domain**

- Define `AchievementDefinition` separately from `UserAchievement`. Definitions hold copy/art/criteria metadata; the ledger holds durable unlock facts.
- Add `achievements` to an appropriate profile/read context, not to every screen's reconstructed selectors.
- Return new unlocks in mutation outcomes so the celebration coordinator can present exactly-once feedback.
- The Profile badge grid uses a reusable card with earned/locked/progress variants and accessible labels.

**Backend and data**

- Add `achievement_definitions` and `user_achievements(user_id, achievement_id, earned_at, reward_coins)` with unique `(user_id, achievement_id)`.
- Create a private `grant_eligible_achievements(user_id, trigger)` helper invoked inside quest completion, chapter claim, check-in, equipment discovery, and shield-consumption transactions.
- Insert with conflict protection and award coins only for rows newly inserted in that transaction.
- If evaluating every definition becomes expensive, filter by trigger type and use aggregate counters/read models. Do not run an unrestricted full-history scan after every mutation.
- Users may read only their own achievement ledger; clients cannot insert unlocks directly.
- Guest mode runs the same definitions locally and records unlock IDs/timestamps in cached state.

**Verification**

- Test threshold boundaries, simultaneous qualifying events, retry idempotency, legacy users already beyond a threshold, coin award exactly once, locked progress copy, and parity.
