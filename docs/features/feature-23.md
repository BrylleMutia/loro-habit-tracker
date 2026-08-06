# Feature #23 - Daily/Weekly Summary at Check-In (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-23)

### <a id="feature-23"></a>23. Daily/Weekly Summary at Check-In (P3)

**What:** When the player does their daily check-in, show a quick summary of yesterday's accomplishments.

**Why:** Ties the check-in ritual to recent accomplishments, making it more rewarding.

**Implementation notes:**
- Extend `TrailStampDetails` to include previous-day summary
- "Yesterday you completed 3 quests, earned 85 coins, and found a Rare Cape!"
- Pull data from `activityLog` filtered to yesterday's date key

---

## Delivery Blueprint — Phase 3 — Long-Term Engagement and Compassionate Retention

### <a id="blueprint-feature-23"></a>Feature #23 — Daily and Weekly Summaries

**Product**

- Show a deterministic previous-day summary after daily check-in succeeds. On the first check-in of a new week, optionally add a compact prior-week recap.
- Summaries include completions, active habits, XP/coins earned, best streak change, and notable loot only when those facts exist.
- Use supportive copy for zero-completion periods; never frame a missed day as lost progress.

**Data architecture**

- Add typed `DailySummary`/`WeeklySummary` read models. Do not ask an LLM to calculate or invent totals.
- Extend the check-in outcome with a server-computed summary, or fetch it through `get_activity_summary(start_date, end_date)` after a successful claim.
- Aggregate directly from completion/activity/discovery ledgers using the user's timezone. Current compact `activityLog` is not guaranteed to represent all history.
- Guest mode computes from local completion/activity data with the same utility.
- Cache the rendered summary with its period key so dismiss/reopen does not refetch unnecessarily.

**Verification**

- Test no activity, multiple habits/day, loot, timezone boundary, week start locale decision, duplicate check-in, offline guest, and totals matching source rows.
