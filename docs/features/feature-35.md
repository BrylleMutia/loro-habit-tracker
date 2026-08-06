# Feature #35 - Adaptive Lory Messages (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-35)

### <a id="feature-35"></a>35. Adaptive Lory Messages (P2)

**What:** Lory's briefing adapts its tone and content based on player context — completion status, missed days, low energy, or returning after a break.

**Why:** The LoryBriefing system already exists with daily prompts. Making messages context-aware deepens the companion feeling and differentiates Loro from sterile habit trackers.

**Context triggers:**
| Trigger | Lory's tone | Example |
|---------|------------|---------|
| First quest of the day | Encouraging | "A fresh trail awaits! Let's start strong. 🦜" |
| All habits done | Celebratory | "You cleared every trail today! Rest well, adventurer." |
| Returning after 2+ missed days | Welcoming, no guilt | "The trail missed you! No rush — take it one step at a time." |
| Low energy (< 2) | Gentle nudge | "Running low on trail supplies. Water and Sleep don't need energy!" |
| Streak at risk (past 8 PM) | Urgent but kind | "Your flame is flickering! A quick quest will keep it burning. 🔥" |
| Midday (all habits unstarted) | Playful | "Lory's packed lunch and is ready when you are!" |

**Implementation notes (partially built):**
- Extend `LoryBriefingContext` in `src/types/loryBriefing.ts` with context trigger fields
- Update `buildLoryBriefingContext()` in `src/utility/loryBriefing.ts`
- Modify the Supabase Edge Function `generate-lory-briefing` to accept context and adjust prompt
- Fallback: local template strings when offline, server-generated when online
- ✅ Briefing presentation caps the visible message viewport at four lines; longer generated text scrolls inside the card while loading and refresh controls remain fixed.
- Respect the existing daily refresh limit (2 per day)
- ✅ Daily generation, local/server cache, thinking/failure UI, 128-character validation, and the two-refresh limit already exist.
- Remaining work: add explicit time bucket, inactivity gap, all-trails-cleared, low-energy, and streak-risk facts; construct or validate all app facts server-side before sending them to DeepSeek.

---

## Delivery Blueprint — Phase 4 — Identity, Social, Economy, and Launch

### <a id="blueprint-feature-35"></a>Feature #35 — Fully Adaptive Daily Lory Briefing

**Current foundation**

- Keep the existing one-briefing-per-local-date server cache, generation lease, 128-character validation, explicit refresh limit, local cache, thinking state, and static fallback.
- Preserve guest behavior as deterministic local copy; do not expose a model key in the client.

**Context improvements**

- Add deterministic signals rather than raw logs: `timeOfDay`, `daysSinceLastActivity`, `allAvailableHabitsComplete`, `atRiskHabitCount`, `freeQuestCount`, `staleTimedQuest`, and concise recent trend deltas.
- Keep the compact contract versioned and bounded. Never send UUIDs, email, notes, full inventory, raw activity events, or full quest/chapter definitions.
- Rank pending actions before serialization so only the most relevant facts reach the prompt.

**Server authority and safety**

- Build the model context in the Edge Function from an authenticated, server-authoritative snapshot/read RPC, or strictly compare every app-specific fact against that snapshot. Verifying only date/timezone is insufficient.
- Continue authenticating the caller and use a server secret only for DeepSeek. The admin client must be scoped to the function and never returned to the app.
- Treat model output as untrusted: parse JSON, normalize whitespace, enforce Unicode character length, reject unsupported claims when detectable, and fall back without exposing provider errors.
- Store the final message plus compact metadata/hash; do not persist full prompts or personal activity context.

**Prompt and UX**

- Define deterministic tone precedence: safety/failure fallback → all complete → urgent claim/at-risk action → returning welcome → low energy/free alternative → interesting statistic/tip.
- Mention at most one action and one insight, avoid guilt/medical advice, and never invent rewards/actions.
- Refresh generates a new insight from current authoritative context but remains limited to two user-requested refreshes per day.

**Verification and operations**

- Unit-test context compaction/redaction and output validation; Edge-test cache/lease/concurrency/refresh/failure/auth; UI-test thinking/offline/fallback/limit.
- Track latency, failure category, cache hit, refresh count, and character length without logging prompt contents or message text by default.
