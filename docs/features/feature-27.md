# Feature #27 - Campfire Rest Days (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-27)

### <a id="feature-27"></a>27. Campfire Rest Days (P3)

**What:** A "rest day" mechanic — once per week, declare a rest day that preserves your streak without completing a quest.

**Why:** User-requested. Alternative to streak shields. More compassionate: acknowledges that rest is part of a healthy routine, not a failure.

**Implementation notes:**
- Add `restDaysUsedThisWeek: number` and `maxRestDaysPerWeek: 3` to state
- "Campfire" button on Home: "Take a rest day — your streak is safe."
- Visual: Lory sitting by a campfire
- Resets weekly (Sunday or Monday depending on locale)
- Could cost coins instead of being free: 20 coins per rest day
- **"Path progress is safe" messaging:** When the user returns after a missed day, show a reassuring message: "You missed a day, but your path progress is safe. Streaks can be rebuilt!" This reinforces that only streaks reset — never adventure path progress.

---

## Delivery Blueprint — Phase 3 — Long-Term Engagement and Compassionate Retention

### <a id="blueprint-feature-27"></a>Feature #27 — Campfire Rest Day

**Recommended rules**

- Provide one free global rest day per ISO week in v1. It preserves the app-wide and currently enabled habit streaks for that local date but grants no completions, path nodes, coins, XP, loot, Guild progress, or achievements tied to completion.
- A rest day must be intentionally declared for the current local date before midnight. It cannot be backdated after the user sees a streak reset.
- Rest-day protection is evaluated before streak shields; a valid rest day prevents shield consumption.
- Do not charge coins in v1. Charging for rest conflicts with the compassionate product position and muddies the economy.

**Client**

- Add a Campfire card/action with remaining weekly use, exact effect copy, confirmation, and Lory rest artwork.
- Completed habits remain completed; pending quests remain available that day until the player explicitly rests. Decide whether declaring rest closes all pending quests for that date—recommended: yes, with clear confirmation.
- Show rest dates distinctly in statistics/heatmap without counting them as completion.

**Backend and domain**

- Add `rest_days(user_id, rest_on, week_key, declared_at)` with unique date and one-per-week constraints.
- Implement `declare_rest_day` as an idempotent RPC that validates local date/week and returns the refreshed snapshot.
- Update private effective/next streak functions to treat valid rest dates as protected gaps while leaving path progress unchanged.
- Add equivalent local repository rules and include rest facts in summaries/Lory context without guilt-oriented phrasing.

**Verification**

- Test same-week duplicate, timezone/week boundary, declare after completion, declare after midnight, shield precedence, multiple missed days, enabled-habit changes, no reward/Guild progress, and parity.
