# Feature #24 - Calendar Heatmap (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-24)

### <a id="feature-24"></a>24. Calendar Heatmap (P3)

**What:** GitHub-style contribution grid showing completion density over time.

**Why:** Requested by the user. Visually satisfying way to see long-term consistency.

**Implementation notes:**
- New component `CompletionHeatmap` using `react-native-svg`
- Data from `activityLog` — count completions per day
- Show last 3-6 months in a grid (columns = weeks, rows = days)
- Color intensity: 0 = grey, 1-2 = light green, 3-4 = medium, 5+ = dark green
- Place in More → Stats or Profile

---

## Delivery Blueprint — Phase 3 — Long-Term Engagement and Compassionate Retention

### <a id="blueprint-feature-24"></a>Feature #24 — Completion Heatmap

**Read model**

- Add `get_completion_calendar(start_date, end_date)` returning one row per active date with completion count and optionally distinct-habit count.
- Bound the first UI to 13 or 26 weeks and validate maximum server range. Apply the user's configured timezone consistently.
- Use the existing completion index and add an expression/covering index only if `EXPLAIN` on realistic data shows it is needed.
- Cache by user/range and return cached data offline.

**UI**

- Build `CompletionHeatmap` with `react-native-svg`, semantic color tokens, month labels, weekday hints, and a selected-day detail.
- Provide an accessible text summary/list for screen readers and a legend that does not depend on color names.
- Handle zero history, partial first week, future days, leap day, narrow screens, dark mode, and large text.
- Place the heatmap inside Statistics rather than duplicating it on both More and Profile.
