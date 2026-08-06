# Feature #15 - Path Node Animation Polish (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-15)

### <a id="feature-15"></a>15. Path Node Animation Polish (P2)

**What:** Add subtle animations to adventure path nodes beyond static styling.

**Why:** The adventure path is the core visual metaphor. Animations make it feel alive.

**Animations:**
- **Active node:** Soft pulse/glow ring (Reanimated `withRepeat` scale 1→1.05)
- **Node unlock:** Scale-up + fade-in when midnight rolls over
- **Node complete:** Brief burst + checkmark pop (already partially in place via celebration)
- **Chapter complete:** Full-row particle burst (distinct from single-node)
- **Locked nodes:** Subtle "shimmer" on the lock icon to indicate they're not broken, just waiting

**Implementation notes:**
- Animated wrapper around node items in `HabitPathScreen`
- Use `useReducedMotion()` to skip when accessibility setting is on
- Performance: only animate visible nodes (FlatList vs ScrollView consideration)
- **Stretch goal — Visual path map:** Transform the vertically stacked chapter list into a winding trail/board-game aesthetic with connected nodes, Lory standing at the active node, and themed terrain backgrounds per chapter (forest, ridge, springs). This is high-effort but would dramatically reinforce the gamification identity.

---

## Delivery Blueprint — Phase 2 — Retention, Progression, and Core Polish

### <a id="blueprint-feature-15"></a>Feature #15 — Adventure Path Motion

**Motion system**

- Extract a focused path-node component with explicit `locked`, `active`, `completed`, and `newlyUnlocked` variants.
- Animate only semantic transitions: active-node breathing, completion check pop, one-time unlock entrance, and chapter-complete burst.
- Prefer `transform` and `opacity`; avoid animating height, width, top/left, or large shadow radii every frame.
- Use Reanimated's system reduced-motion configuration for timing, delay, entering, exiting, and layout effects. Static state changes must remain understandable without motion.
- Avoid continuous shimmer on every locked node. At most one active ambient animation should run in the visible path area.

**Event and performance model**

- “Newly unlocked” must come from a date-roll or completion event, not simply animate every time the component mounts.
- Cancel repeated animations on unmount/background and avoid JS timers for frame animation.
- Keep the current ScrollView while content remains small. Move to `FlatList` only after profiling shows path length/content expansion requires virtualization.
- The winding-map stretch goal should use data-driven node coordinates/segments and preserve a linear accessible reading order.

**Verification**

- Profile low-end Android, screen transitions, long paths, rapid habit switching, background/foreground, reduce motion, and no animation replay after ordinary rerender.
