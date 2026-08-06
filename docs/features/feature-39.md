# Feature #39 - Pull-to-Refresh + Skeleton Loading States (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-39)

### <a id="feature-39"></a>39. Pull-to-Refresh + Skeleton Loading States (P2)

**What:** Add `RefreshControl` to Home and other scrollable screens. Replace text-only loading messages with animated skeleton placeholder cards.

**Why:** Pull-to-refresh is a standard mobile pattern users expect. Skeleton screens reduce perceived loading time and feel more polished than "Loading profile details…" text.

**Implementation notes:**
- Add `RefreshControl` to `HomeScreen`, `GuildScreen`, `StashScreen`, `ProfileScreen` ScrollViews
- On refresh, call `refreshGameState()` from context
- Create a reusable `SkeletonCard` component: animated pulsing placeholder matching real card shapes
- Use Reanimated `withRepeat` opacity loop (0.3 → 0.7) for the pulse effect
- Replace inline loading text with skeleton cards in Profile, Stash, and Guild screens
- Respect `useReducedMotion()` — show static placeholders when reduce motion is enabled

---

## Delivery Blueprint — Phase 5 — Celebration, Inventory, and Sync Polish

### <a id="blueprint-feature-39"></a>Feature #39 — Pull-to-Refresh and Skeletons

**Refresh behavior**

- Add a shared `RefreshControl` configuration to Home, Guild, Stash, Profile, and More where the root is scrollable.
- Call the existing deduplicated `refreshGameState()`; never create parallel screen-specific snapshot fetches.
- Show existing cached data while `syncStatus === "refreshing"`. Pull-to-refresh failure leaves that data visible and uses the existing sync banner/retry path.
- Disable or coalesce refresh while a game mutation is in flight to avoid confusing stale-after-write races.

**Skeleton behavior**

- Skeletons represent initial no-data hydration and paged secondary reads, not every background refresh.
- Build small reusable skeleton primitives matching card geometry; do not duplicate entire screen trees.
- Use transform/opacity animation with reduced-motion fallback to static placeholders.
- Avoid random widths on every render, which causes flicker and unstable snapshots.

**Verification**

- Test cold start with/without cache, slow network, offline, refresh success/failure, simultaneous pull on mounted tabs, mutation in flight, reduced motion, and tab/safe-area layout.
