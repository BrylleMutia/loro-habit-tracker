# Feature #16 - Streak "At Risk" Visual Warning (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-16)

### <a id="feature-16"></a>16. Streak "At Risk" Visual Warning (P2)

**What:** If it's past 8 PM in the user's timezone and a habit isn't completed, tint the habit icon amber/orange and show a subtle warning.

**Why:** Proven nudge pattern from Duolingo, Streaks, etc. Creates urgency without being annoying.

**Implementation notes:**
- In `DailyQuestCard` or `HabitSwitcher`, check timezone-aware hour
- If hour >= 20 and `!completedToday`, apply amber border/icon tint
- Optional text: "🔥 Streak at risk — complete before midnight!"
- The `timeZone` field in settings is already available via context

---

## Delivery Blueprint — Phase 2 — Retention, Progression, and Core Polish

### <a id="blueprint-feature-16"></a>Feature #16 — Streak-at-Risk State

**Domain and copy**

- Add a pure `getStreakRiskState` selector using synchronized current time, configured timezone, effective streak, completion status, path-complete status, and a configurable threshold (initially 20:00).
- A habit is at risk only when it has a non-zero effective streak, has an available unfinished quest, and is not already protected by a declared rest-day rule.
- Use calm urgency: “Complete before midnight to continue your 7-day streak.” Avoid flames/failure language for users with no existing streak.

**UI**

- Apply one amber status badge/border in the Home selector and Daily Quest card; do not recolor every surface.
- Show remaining time using the existing local-day boundary utility. Do not write risk state to `AppState`.
- Update on app activation and a modest interval; this is local computation and has no network cost.
- Integrate Feature #10 by scheduling/canceling one risk notification rather than duplicating eligibility logic.

**Verification**

- Test before/at/after threshold, timezone/DST, server clock offset, zero streak, completed/path-complete, active timed quest, rest day/shield interaction, and date rollover.
