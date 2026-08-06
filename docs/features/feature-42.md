# Feature #42 - Item Catalog — All Collected Items (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-42)

### <a id="feature-42"></a>42. Item Catalog — All Collected Items (P2)

**What:** A read-only gallery in the More tab showing every item definition the player has ever discovered, including items no longer in their inventory (sold, salvaged, or otherwise lost). Separate from the Stash (which shows currently owned gear for equipping).

**Why:** Players want to track their collection history, not just their current inventory. The data already exists in `discoveredItemDefinitionIds` — this is purely a display feature. It turns More from a bare sign-out page into a meaningful collection hub.

**Data source:**
- `state.inventory.discoveredItemDefinitionIds: string[]` — all item definitions ever seen
- `equipmentItemsById` from constants — item metadata (name, image, set, slot, rarity)
- `state.inventory.items` — used only to show how many are currently owned vs. total discovered
- The existing `equipment_discoveries` ledger is the authoritative source for first discovery. Current inventory cannot provide a date for an item that was later salvaged or otherwise removed.

**Display:**
- Grouped by equipment set (Verdant Wayfinder, Emberforge Vanguard, Tidesong Arcanist)
- Each item card shows: image, name, rarity badge, slot label, first-acquired date
- Set header shows: set name, X/8 collected progress bar, set theme colors
- Sort options: by set, by rarity, by acquisition date
- Show "Not yet discovered" greyed-out slots for items in known sets that the player hasn't found
- Lory illustration: "Sleeping" variant in the empty space when no items are discovered yet (ties into #22)

**Implementation notes (foundation built):**
- New component `ItemCatalogScreen` or integrate into the More screen as a section
- Pure read-only — no equip, unequip, salvage, or trade actions
- Uses existing `equipmentItemsById`, `equipmentSetThemes`, and `discoveredItemDefinitionIds`
- ✅ The discovery ledger and `discoveredItemDefinitionIds` snapshot field already exist.
- Extend the read model with `discoveredAt` metadata or add a small catalog RPC if first-acquired dates are shown; IDs alone are insufficient.

---

## Delivery Blueprint — Phase 5 — Celebration, Inventory, and Sync Polish

### <a id="blueprint-feature-42"></a>Feature #42 — Discovered Item Catalog

**Navigation and UX**

- Add Catalog as a More-hub destination or a secondary Stash view. Keep Stash focused on owned/equippable instances and Catalog focused on discovery history.
- Group by equipment set with X/8 progress and themed presentation. Unknown slots use silhouettes/slot labels without leaking undiscovered item art/name if discovery is meant to matter.
- Support sort/filter only after the basic grouped view is useful; avoid a complex control bar for the small launch catalog.
- Item details are read-only and clearly label currently owned quantity versus discovered-but-not-owned.

**Data**

- Reuse `equipment_discoveries` as the durable ledger and add `discoveredAt` to a compact catalog read model.
- Either extend the snapshot with `equipmentDiscoveries: { itemDefinitionId, discoveredAt }[]` while the catalog remains small or add `get_equipment_catalog()`; choose one source and remove the IDs-only duplication.
- Join to server equipment definitions for authority, then map server definition IDs to bundled art. Handle definitions whose art has not shipped.
- Salvage/trade never deletes a discovery row.
- Guest mode records the first local acquisition date with the same contract.

**Verification**

- Test new player, partial/full set, discovered item no longer owned, duplicate acquisitions, unknown/deprecated definition, set ordering, dark mode, empty Lory state, and server/guest parity.
