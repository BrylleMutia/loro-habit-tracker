# Feature #22 - Empty State Illustrations (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-22)

### <a id="feature-22"></a>22. Empty State Illustrations (P3)

**What:** Show Lory in different poses for empty states instead of blank space.

**Why:** `PixelParrot` already exists. Empty states are a prime opportunity for personality.

**Lory variants needed:**
- "Thinking" — inventory empty: "No gear yet! Complete quests to find loot."
- "Sleeping" — no active guild quests: "The quest board is quiet. Check back soon!"
- "Celebrating" — all habits done: "Perfect day!"
- "Waving" — welcome back after absence

**Implementation notes:**
- Create alternate parrot PNG assets or use `PixelParrot` with animation variants
- Reusable `EmptyState` component with `PixelParrot`, message, optional CTA

---

## Delivery Blueprint — Phase 3 — Long-Term Engagement and Compassionate Retention

### <a id="blueprint-feature-22"></a>Feature #22 — Lory Empty States

**Component and assets**

- Create one reusable `EmptyState` with canonical Lory image, title, concise body, optional semantic CTA, accessibility label, and compact/full variants.
- Define an `EmptyStateKind` mapping for Stash, Guild, Catalog, Statistics, search/filter, offline-no-cache, and completed-all-trails states.
- Use transparent, crisp pixel-art assets registered in `src/constants/images.tsx`; use `contain` and stable frames to avoid layout shifts.
- Empty states explain what happened and what the player can do next. Do not show a CTA that cannot work offline or while a mutation is in flight.
- Decorative Lory images should be hidden from the accessibility tree when the adjacent text already communicates the state.

**Verification**

- Verify every empty/filter/error distinction, small screens, large text, dark mode, missing/failed image fallback, and CTA navigation.
