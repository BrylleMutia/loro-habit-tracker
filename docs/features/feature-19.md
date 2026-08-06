# Feature #19 - Habit Completion Notes (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-19)

### <a id="feature-19"></a>19. Habit Completion Notes (P3)

**What:** Optional single-line text note when completing a habit (e.g., "Read Chapter 4 of Dune").

**Why:** Adds personal context without complicating the interaction model. The "one-tap complete" philosophy is preserved by making notes optional.

**Implementation notes:**
- Keep the Daily Quest action unchanged. Offer "Add a note (optional)" only after the completion transaction succeeds.
- Store as `note?: string` on `NodeCompletionRecord`
- Display in activity log and path node detail
- The note UI is dismissible and must not delay rewards, streaks, loot, or navigation.

---

## Delivery Blueprint — Phase 3 — Long-Term Engagement and Compassionate Retention

### <a id="blueprint-feature-19"></a>Feature #19 — Optional Completion Notes

**Interaction**

- Completion remains one tap/hold and commits rewards immediately.
- After the completion/loot result, offer a single-line “Add a note” affordance. The user can skip it without another confirmation.
- Limit notes to a short plain-text value (recommended 160 Unicode characters), show remaining count near the limit, and trim surrounding whitespace.
- Notes are private by default and are never sent to Lory, analytics, social feeds, or notifications unless a future opt-in product decision says otherwise.

**Client and data**

- Add a stable completion ID to `NodeCompletionRecord` and `QuestCompletionOutcome` so a note targets one authoritative completion.
- Add `note: string | null` to `quest_completions` with a database length constraint.
- Implement `update_completion_note(completion_id, note)` as an ownership-checked RPC. It updates only the note field and cannot modify rewards, dates, habit, chapter, or node.
- Add `updateCompletionNote` to game actions and local repository. A failed note save must state that the quest/rewards are already safe.
- Render notes in the paged activity timeline and node details; avoid placing all notes in the compact game snapshot if history becomes large.

**Verification**

- Test blank/trimmed/max/over-limit text, Unicode length, ownership, retry, completion already saved when note fails, guest parity, keyboard avoidance, and screen-reader labels.
