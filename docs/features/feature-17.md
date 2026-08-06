# Feature #17 - Chapter Preview / Teasers (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-17)

### <a id="feature-17"></a>17. Chapter Preview / Teasers (P2)

**What:** Show the next chapter's name, theme, and description when the current chapter is complete but the next isn't unlocked yet.

**Why:** Builds anticipation. Currently the path just shows locked nodes with no context.

**Implementation notes:**
- After chapter N is complete, show a locked card for chapter N+1
- Card shows: chapter title, description, node count, reward preview
- "Complete Chapter N first to unlock" label
- Data already exists in `habits.ts` chapter blueprints

---

## Delivery Blueprint — Phase 2 — Retention, Progression, and Core Polish

### <a id="blueprint-feature-17"></a>Feature #17 — Chapter Preview

**Product and UI**

- Show the next authored chapter only when the current focus chapter is complete or nearly complete and the next definition exists.
- Preview title, theme, short description, node count, and broad reward category. Avoid exposing exact future loot rolls.
- Use a reusable `ChapterPreviewCard` with locked/available states and a clear requirement. Do not make locked previews look tappable unless they open meaningful details.

**Domain and content**

- Add a pure selector that returns the next section and unlock reason from immutable chapter order/completions.
- Keep chapter definitions versioned and IDs immutable once users can complete them. Editing titles/copy is safe; changing IDs/order/rewards requires migration/content-version review.
- If no next authored chapter exists, use the end-of-path state from the dedicated path-expansion plan rather than showing an empty locked card.

**Verification**

- Test first chapter, final node incomplete, current chapter complete/unclaimed reward, next chapter available, final authored chapter, and guest/remote snapshots.
