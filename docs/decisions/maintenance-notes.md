# Maintenance Notes

> Decision record extracted from the roadmap. Read this file only when the task touches this topic.

## <a id="maintenance-notes"></a>Maintenance Notes

### Immediate Engineering Debt Found in the 2026-07-27 Audit

Resolve these before starting a new economy/progression mutation:

1. **✅ Streak-shield remote parity:** Feature #4's forward migration now aligns authenticated earning, consumption, duplicate outcomes, and snapshot counts with the guest repository. Staged rollout verification remains required before economy expansion.
2. **Target-override hardening:** the current migration and client support timed overrides, but one-time overrides are not behaviorally enforceable, JSONB keys/ranges need strict server validation, and per-tap fire-and-forget writes can race.
3. **Shared date/timezone utilities:** date-key and timezone-boundary calculations are repeated across Context, Home greeting, Lory context, and Daily Quest cooldown. Consolidate them before Features #10, #16, #21, #23, and #24 depend on identical boundaries.
4. **Component test harness gap:** TypeScript checks, Supabase pgTAP, and pure local-rule tests are committed; add component/integration coverage in Feature #43 before complex selectors and celebration sequencing expand.
5. **Snapshot growth:** do not keep adding full histories to `build_game_snapshot`. Introduce focused paged read models for statistics, activity, Guild history, and catalog metadata.

### Guild Quest Descriptions Are Stale

The guild quest catalog in `src/constants/guildQuests.ts` contains descriptions referencing "four habits" (e.g., "Four Corners: Complete each of the four habits at least once"). The app now has **six** habits. Update:

- `"four-corners"` — change target from 4 to 6, update description to "six habits"
- Any other quests referencing a specific habit count
- Guild quest period logic in `src/utility/guildQuests.ts` — verify it handles 6 habits correctly
- The guild quest board UI should clarify the difference between: Available → Accepted → In progress → Completed → Reward claimed

**Effort:** Low | **Impact:** Medium (prevents player confusion)

---
