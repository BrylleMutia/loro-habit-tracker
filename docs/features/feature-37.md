# Feature #37 - Equipment Comparison on Equip (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-37)

### <a id="feature-37"></a>37. Equipment Comparison on Equip (P2)

**What:** When viewing an item in the inventory modal, show a side-by-side stat comparison against the currently equipped item in the same slot.

**Why:** Currently `InventoryStackDetailsModal` shows an item's stats in isolation. Players can't tell if equipping it is an upgrade or sidegrade without memorizing their current gear. A stat diff (green ↑, red ↓) makes equip decisions feel meaningful and RPG-like.

**Implementation notes:**
- Extend `InventoryStackDetailsModal` to accept the currently equipped item for the same slot
- Render two columns: "Equipped" vs "Selected"
- Diff indicators: `+2 Strength` in green, `−1 Luck` in red
- Show total attribute change summary at the bottom
- Respect the existing equip action flow — comparison is read-only guidance

---

## Delivery Blueprint — Phase 5 — Celebration, Inventory, and Sync Polish

### <a id="blueprint-feature-37"></a>Feature #37 — Equipment Comparison

**Domain utility**

- Add a pure `compareEquipmentStats(selected, equipped)` utility that returns all known attributes in a stable order with previous, next, and signed delta.
- Treat missing stats as zero and preserve distinctions between upgrade, downgrade, and unchanged. Do not add set bonuses until a real set-bonus mechanic exists.
- Reuse existing slot/equipped selectors; the modal should receive or derive one selected and one equipped item without querying the backend.

**UI**

- In `InventoryStackDetailsModal`, show the currently equipped item header, selected item header, per-stat rows, and a compact total direction summary.
- Pair green/red color with arrows and signed text. Use semantic accessibility labels such as “Strength increases by 2.”
- Handle empty slot (“No item equipped”), selected item already equipped, exact sidegrade, and long localized names.
- Comparison is read-only and must not change the existing atomic equip action.

**Verification**

- Unit-test sparse/negative/unchanged stat maps and every attribute; component-test empty/equipped/same/upgrade/mixed states and large text.
