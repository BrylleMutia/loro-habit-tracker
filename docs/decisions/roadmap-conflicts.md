# Conflict Analysis

> Decision record extracted from the roadmap. Read this file only when the task touches this topic.

## <a id="conflict-analysis"></a>Conflict Analysis

### Resolved Overlaps and Implementation Decisions

| Overlap | Decision |
|---------|----------|
| Guided tour (#14) vs IKEA onboarding (#25) | #25 is the pre-auth investment/conversion funnel; #14 is versioned product education after the user reaches the app. They share visual primitives, not progress state. |
| Streak shields (#4) vs Campfire rest days (#27) | A declared rest day is evaluated first and does not consume a shield. Shields cover an otherwise unprotected missed gap on the next completion. |
| Coin Shop (#5) vs real-money business model (#32) | Earned coins may buy gameplay consumables. Real money remains cosmetic/supporter-only and cannot directly buy streak, energy, or loot advantage. |
| Shop vs five-tab navigation | Shop lives inside Stash/More; do not add a sixth bottom tab. |
| Statistics (#7), heatmap (#24), and Catalog (#42) | More is a hub. Statistics owns charts/heatmap; Catalog owns discovery history; Profile keeps only a concise summary/showcase. |
| Completion notes (#19) vs minimal Daily Quest interaction | Notes appear only after the completion transaction and never block rewards or add inputs to the quest card. |
| Level-up (#12), chapter complete (#36), achievements (#11), loot details (#41), and continuation (#33) | Build one celebration/UI-event coordinator and queue semantic events. Do not nest or independently open competing modals. |
| Lory briefing (#35), streak risk (#16), summaries (#23), and notifications (#10) | Share deterministic selectors/read models for facts. AI creates copy only; it does not calculate rewards, eligibility, risk, or summary totals. |
| Custom habit idea vs target customization (#28) | #28 is limited to validated existing-habit targets, with timed duration as the first complete slice. Full custom habit creation remains deferred. |
| Friend/social (#30) vs habit privacy | Social is opt-in and exposes a purpose-built summary only. Private game tables, notes, exact activity, and email remain inaccessible. |

### Deferred Product Decision: Gear Attributes Affecting Habits

> ☐ Replace quests with something that users can utilize gear attributes?

Gear stats are currently collectible/display-only. Making them affect quest mechanics adds game depth but risks:
- Making habits feel like "grinding for stats" rather than self-improvement
- Players optimizing for stat gains over actual habit consistency
- Complexity creep in what's currently an elegant simple loop
- Creating pay-to-win pressure once Shop or Supporter entitlements exist
- Making server/guest balance and notification/stat explanations harder to understand

**Recommendation:** Do not implement attribute effects before Shop, statistics, economy telemetry, and launch controls are stable. If playtesting still supports the idea, begin with one transparent, capped passive bonus and never reduce the real habit requirement or gate completion behind gear.

---
