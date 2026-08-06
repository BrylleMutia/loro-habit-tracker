# Feature #7 - Statistics & Insights Dashboard (P1)

> Roadmap index: [PLANS.md](../PLANS.md#feature-7)

### <a id="feature-7"></a>7. Statistics & Insights Dashboard (P1)

**What:** Transform the More tab from a bare sign-out button into a stats hub.

**Why:** `activityLog` and all completion records already exist in state. Players crave visibility into their progress.

**Sections:**
- **Weekly Overview:** 7-day bar chart of completions per day
- **Habit Distribution:** Which habits get the most completions (horizontal bar or donut)
- **Per-Habit Breakdown:** For each habit — total quests, total tracked time (timed), best streak, last completed date, chapter progress
- **Personal Records:** Best streak, longest timed quest, most coins in a day
- **Collection Progress:** "You've found 12 of 16 Verdant Wayfinder pieces"
- **All-Time Stats:** Total quests, total coins earned, total XP
- **Activity Log:** Scrollable timeline of recent completions with timestamps, rewards, and loot (accessible from Profile)

**Implementation notes (partially built):**
- Use `react-native-svg` (already installed) for simple charts
- Compose the dashboard from reusable chart and summary primitives rather than one large component
- Use paged/range-scoped Supabase read models for authenticated all-time data; use the local repository's durable history for guests
- Pure computation in `src/utility/statistics.ts`
- ✅ Profile already contains a small lifetime-statistics summary. The full range-selectable dashboard, accessible charts, server-backed history, and More navigation remain planned.

---

## Delivery Blueprint — Phase 1 — Complete the P1 Core Experience

### <a id="blueprint-feature-7"></a>Feature #7 — Statistics and Insights

**Product and UX**

- Convert More into a compact hub with destinations for Statistics, Collection Catalog, Settings, Help/Privacy, and Account. Avoid placing every full feature in one long More screen.
- Statistics opens with a 7-day overview and supports explicit ranges such as 7 days, 30 days, and all time.
- Every chart includes a textual summary and accessible labels. Do not rely on color or SVG geometry alone.
- Use progressive disclosure: overview cards first, per-habit details second, activity timeline last.

**Client and domain**

- Add `src/utility/statistics.ts` for deterministic bucketing, record selection, duration formatting, and per-habit aggregation.
- Create small chart primitives (`CompletionBars`, `HabitDistributionBars`, `CompletionHeatmap`) rather than one monolithic dashboard component.
- Prefer horizontal bars to a donut for habit comparison because labels and values remain readable on narrow screens.
- Keep selected range, expanded habit, and sort mode as screen-local presentation state.
- Cache the last successful stats response per user/range; show cached data while refreshing and a clear stale/offline label.

**Backend and data**

- Do not rely on a potentially bounded `activityLog` snapshot for all-time records.
- Add typed read RPCs such as `get_player_statistics(p_range_start, p_range_end)` and paginated `get_activity_history(p_cursor, p_limit)`.
- Aggregate from `quest_completions`, `activity_log`, `chapter_reward_claims`, inventory/discovery ledgers, and profile streak fields. Return only fields the dashboard renders.
- Apply the user's configured timezone when grouping timestamps into date keys.
- Keep range predicates index-friendly and add/verify `(user_id, completed_on)` and `(user_id, occurred_at desc)` indexes.
- Read RPCs verify `auth.uid()` and expose only the caller's data. Guest mode computes from local state.

**Verification**

- Test empty/new player, one completion, multiple habits on one day, timezone edge, path-complete habit, and large history.
- Cross-check aggregate totals against raw seeded records in pgTAP.
