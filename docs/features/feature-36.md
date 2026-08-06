# Feature #36 - Chapter Completion Celebration (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-36)

### <a id="feature-36"></a>36. Chapter Completion Celebration (P2)

**What:** A dedicated celebration variant for completing all 7 nodes in a chapter — distinct from individual quest completion and level-up celebrations.

**Why:** Currently only individual quests trigger the loot modal. Finishing an entire chapter is a much larger milestone (7 days of consistency) and deserves its own moment. The chapter reward claim flow already exists but has no fanfare.

**Celebration content:**
- "Chapter Complete!" banner with the chapter name and description
- Total chapter rewards breakdown (coins + XP bonus)
- Confetti/particle burst distinct from quest loot drops
- Smooth transition into the "Claim chapter reward" button
- Lory appears with a celebratory pose

**Implementation notes:**
- Add a `"chapter-complete"` variant to `QuestCelebrationModal`
- Emit a typed `chapterCompleted` event from the authoritative quest-completion outcome when node seven completes
- Different color palette: gold/purple vs the blue/green of quest loot
- Use existing `isSectionComplete()` utility to detect eligibility

---

## Delivery Blueprint — Phase 5 — Celebration, Inventory, and Sync Polish

### <a id="blueprint-feature-36"></a>Feature #36 — Chapter Completion Celebration

**Domain contract**

- Chapter completion occurs when the final required node is newly completed; chapter reward claiming remains a separate, explicit transaction.
- Extend `QuestCompletionOutcome` with optional `chapterCompleted: { habitId, sectionId, title }`. Return it only for the transaction that newly completes the section.
- Do not infer a “new” chapter completion on every hydration from `isSectionComplete()`, which would replay celebrations.

**UI sequence**

- The celebration coordinator presents quest loot first, then chapter completion, then any level/achievement feedback, then post-completion navigation.
- Use a distinct `ChapterCompleteCelebration` composition with chapter identity, consistency message, gold/reward palette, Lory, and one concise CTA: “View and claim chapter reward.”
- Do not claim the chapter reward automatically. The CTA returns to the relevant path/reward card so the user understands the separate reward action.
- Reduced motion replaces particles/bursts with a static reveal and brief fade.

**Backend and verification**

- The server completion RPC determines whether this insert changed the section from incomplete to complete in the same transaction.
- Guest local repository returns the same outcome.
- Test node 6 vs node 7, already-completed retry, out-of-order/legacy data, chapter reward already claimed, simultaneous request, modal queue order, and parity.
