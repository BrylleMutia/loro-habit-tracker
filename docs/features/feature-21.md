# Feature #21 - Midnight Date-Roll Transition (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-21)

### <a id="feature-21"></a>21. Midnight Date-Roll Transition (P3)

**What:** When the date changes, auto-refresh the UI: lock yesterday's completed nodes, unlock today's, reset quest status.

**Why:** Currently likely requires a pull-to-refresh or app restart to see new day state.

**Implementation notes:**
- `useEffect` in `AppStateProvider` watching `todayDateKey`
- ✅ `DailyQuestCard` now shows a live `Until next quest: ...` countdown to the next local midnight using the configured timezone and synchronized server clock
- ✅ `AppStateProvider` already polls the configured local date and refreshes the local/remote snapshot when it changes.
- Do not mutate or erase durable completion data in a `DAY_ROLLOVER` reducer action. The refreshed snapshot and pure selectors should derive the new active nodes, effective streaks, energy, and guild period.
- Remaining work: define cross-midnight timed-quest behavior and show a one-time, reduced-motion-aware "New day, new quests!" toast.

---

## Delivery Blueprint — Phase 3 — Long-Term Engagement and Compassionate Retention

### <a id="blueprint-feature-21"></a>Feature #21 — Midnight Rollover

**Domain policy**

- The configured timezone and synchronized server clock define the local date. Device wall-clock manipulation must not change authenticated reward eligibility.
- Durable completions, claims, and activity are never reset or deleted. A new date changes only derived “today” status and server-generated current-period views.
- Recommended v1 cross-midnight timed-quest rule: warn when starting too close to reset, expire an unfinished timed quest at local midnight, and refund its reserved energy when authoritative/local rollover cleanup occurs. Document and test this rule before implementation.

**Client**

- Consolidate local date-key and next-boundary calculations into one shared utility/hook used by `AppStateProvider`, Daily Quest cooldown, streak risk, notification scheduling, Lory time facts, and summaries.
- On date-key change, refresh the snapshot exactly once, clear stale presentation state, cancel obsolete notification IDs, and enqueue one “New day, new quests” toast.
- If offline, derive the local guest/cached view without claiming server rewards. Reconcile when connectivity returns.
- Avoid a global reducer action that reconstructs paths or currencies; existing selectors and the refreshed snapshot remain authoritative.

**Backend and tests**

- Ensure snapshot/RPC date calculations use the profile timezone and a single server timestamp per transaction.
- Add cleanup/refund logic for stale active timed quests in a deliberate mutation/private function, not as an accidental side effect of arbitrary reads.
- Test month/year rollover, DST, timezone change, app suspended across midnight, offline rollover, active timer, active modal, duplicate refresh prevention, and server/client date disagreement.
