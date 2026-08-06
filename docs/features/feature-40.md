# Feature #40 - Guild Quest Progress Toasts + Quest History (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-40)

### <a id="feature-40"></a>40. Guild Quest Progress Toasts + Quest History (P2)

**What:** Show a small toast when daily habit completions advance a guild quest's progress. Add a "Past Quests" archive showing completed guild quests from previous periods.

**Why:** There's currently no visible feedback connecting daily actions to guild quest progress. The connection between "I completed Exercise today" and "Steady Trail is now 3/5" should be explicit. A history view adds long-term accomplishment tracking.

**Progress toast implementation notes:**
- Return typed `guildQuestAdvances` from the authoritative quest-completion outcome, with equivalent computation in the guest repository
- Show a non-blocking toast: "🛡️ Steady Trail: 3/5 days" with the guild quest icon
- Toast auto-dismisses after 3 seconds, stacks if multiple quests advance
- Use a lightweight animated banner at the top of the screen (below status bar)

**Quest history implementation notes:**
- Add a "Past Quests" collapsible section at the bottom of `GuildScreen`
- Read claimed history from the existing `guild_quest_claims` ledger with a paginated RPC/read model; do not duplicate only the last four periods into `AppState`.
- Show: quest title, completion date/period, rewards earned
- Fetch a bounded page (for example, four periods) while retaining the authoritative history in Postgres.
- Ties into the [activity log idea](../features/feature-07.md#feature-7) for cross-referencing

---

## Delivery Blueprint — Phase 5 — Celebration, Inventory, and Sync Polish

### <a id="blueprint-feature-40"></a>Feature #40 — Guild Progress Feedback and History

**Progress events**

- Extend quest-completion/chapter outcomes with `guildQuestAdvances`, each containing quest ID/title/icon, previous progress, next progress, target, and newlyCompleted.
- Prefer server-computed advances for authenticated users because the RPC owns completion timing and Guild rules. Guest logic produces the same events locally.
- Feed advances into the shared toast queue. Combine or sequence multiple advances, cap queue length, and prioritize a newly claimable quest.
- Toast taps may navigate to Guild; auto-dismiss pauses appropriately for accessibility and app background.

**History read model**

- Query the existing `guild_quest_claims` ledger joined to definition/reward metadata through `get_guild_quest_history(cursor, limit)`.
- Keep full history in Postgres and page recent periods in the UI. Do not duplicate a four-period archive into the main snapshot.
- Show kind, period, claimed date, final progress, coins/XP, and loot when available.
- Add an empty state and pagination/loading/error behavior inside Guild.

**Verification**

- Test one/multiple advances, no accepted quest, newly ready, already claimed, period rollover, toast queue, exact history ownership, pagination, definition copy changes, and parity.
