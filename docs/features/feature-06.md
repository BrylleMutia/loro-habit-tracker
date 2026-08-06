# Feature #6 - Haptic Feedback (P1)

> Roadmap index: [PLANS.md](../PLANS.md#feature-6)

### <a id="feature-6"></a>6. Haptic Feedback (P1)

**What:** Use `expo-haptics` to provide tactile feedback for key interactions.

**Why:** Settings already has `hapticsEnabled`. Wiring it up makes the app feel native and premium with minimal effort.

**Haptic map:**
- `light` — habit switch, tab press, node tap
- `medium` — quest start, quest complete, item equip
- `heavy` — chapter complete, level up, legendary loot drop
- `selection` — scrolling through habit switcher

**Implementation notes:**
- Install `expo-haptics` (compatible with SDK 54)
- Create `src/hooks/useHaptics.ts` that respects `settings.hapticsEnabled`
- Call from `QuestActionButton`, habit switcher, celebration modal, etc.
- ✅ Bottom-tab navigation uses semantic `selectionAsync()` feedback only after `PersistentTabHost` accepts a real tab change. Same-tab taps and taps rejected during an active transition remain silent.
- ✅ Shared haptic calls treat unsupported-device failures as best-effort feedback and safely absorb rejected promises.

---
