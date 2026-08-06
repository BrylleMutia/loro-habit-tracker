# Feature-Specific: What Happens After Completing All Adventure Paths?

> Decision record extracted from the roadmap. Read this file only when the task touches this topic.

## <a id="after-adventure-paths"></a>Feature-Specific: What Happens After Completing All Adventure Paths?

**Problem:** Each habit currently has 2 chapters (14 days of content). What happens after both are done?

**Options evaluated:**

| Option | Pros | Cons |
|--------|------|------|
| A. Loop chapters (repeat with scaled rewards) | Simple, infinite content | Repetitive, loses novelty |
| B. Procedural "endless path" with RNG nodes | Fresh, game-like | Hard to theme narratively |
| C. Prestige system: restart at higher difficulty with bonus rewards | Rewarding, extendable | Could feel like "losing progress" |
| D. More handcrafted chapters (content expansion) | Best experience | Requires ongoing content work |
| **E. Hybrid: More chapters + prestige option** | **Best of both** | **Higher dev cost** |

**Recommendation:** Start with **Option A + D hybrid**. Add 2-3 more chapters per habit (bringing total to 4-5 chapters = 28-35 days). After final chapter, loop back to Chapter 1 with +50% rewards and a "New Game+" badge. This gives 2-3 months of unique content per habit with infinite replayability.

### Reviewed Implementation Plan

**Stage A — authored content expansion**

- Add new immutable chapter/node definitions through migrations and mirrored typed content/constants. Never reuse or reorder IDs already referenced by completions.
- Keep old rewards and completed records unchanged. Content corrections should be additive or copy-only once live users exist.
- Add a content version and automated integrity tests: sequential chapter order, seven unique nodes per chapter, valid quest types/units, non-negative rewards, and valid habit references.
- Update the snapshot/path selector to naturally surface the next authored chapter; no progress migration should be needed for additive content.
- Build an internal content validation script before increasing from 2 to 4–5 chapters per habit.

**Stage B — recurring/prestige path**

- The current `unique (user_id, node_id)` completion constraint prevents simply looping the same node IDs. Do not implement looping only in the client.
- Add an explicit cycle/prestige dimension such as `habit_cycles(user_id, habit_id, cycle_index, started_at, completed_at)` and include `cycle_index` in completion/claim uniqueness.
- Archive each completed cycle and show it as history; starting a prestige cycle never deletes or rewrites prior completions.
- Define reward scaling with caps and economy simulation before launch. A flat +50% every cycle will inflate coins/XP indefinitely; use a capped curve or cosmetic prestige rewards.
- Add a clear choice after the final authored chapter: continue recurring trail now or rest on the completed path until more content arrives.

**Verification**

- Test legacy users at every chapter boundary, final-node completion, claim state, new content inserted after a path was complete, cycle uniqueness, date locking, Guild metrics across cycles, stats/history, and reward caps.

---
