# Feature #34 - Duplicate Gear Salvage (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-34)

### <a id="feature-34"></a>34. Duplicate Gear Salvage (P3)

**What:** Allow players to convert duplicate inventory items into coins.

**Why:** Inventory already shows item counts and quantities. Duplicates currently have no purpose. A simple salvage action gives them meaning without needing a full shop or crafting system.

**Salvage values by rarity:**
| Rarity | Coins |
|--------|-------|
| Common | 5 |
| Uncommon | 10 |
| Rare | 20 |
| Epic | 40 |
| Legendary | 80 |

**Implementation notes:**
- Add "Salvage" button in `InventoryStackDetailsModal`
- Add an intent-based `salvageInventoryItem` action backed by a transactional authenticated RPC and equivalent guest-repository mutation
- Prevent salvaging equipped items
- Confirmation dialog: "Salvage this [Item Name] for [X] coins?"
- Keep at least one copy of each unique item (anti-frustration)

---

## Delivery Blueprint — Phase 4 — Identity, Social, Economy, and Launch

### <a id="blueprint-feature-34"></a>Feature #34 — Duplicate Gear Salvage

**Product and UX**

- Salvage exactly one unequipped item instance from a stack while always retaining at least one owned copy of that item definition.
- Show server-calculated value, affected quantity, confirmation, resulting coin balance, and an undo-free warning.
- Equipped instances cannot be salvaged; offer “Equip another copy first” only if a valid replacement exists.
- Preserve discovery/catalog history after salvage.

**Client and domain**

- Add `salvageInventoryItem(itemId, idempotencyKey)` and a `"inventory-salvage"` mutation ID.
- Extend the item details modal with a secondary danger action only when `quantity > 1` and a non-equipped instance is selectable.
- Move rarity salvage values to an authoritative domain catalog shared by guest logic and mirrored by the server; the client does not send a coin value.

**Backend**

- Implement `salvage_inventory_item(p_item_id, p_idempotency_key)` to verify ownership, lock the selected item/profile rows, reject equipped/last-copy items, delete one instance, credit coins, and record an activity/economy event atomically.
- Add idempotency/audit data and update the `activity_type` enum/read parser intentionally.
- Users may read their inventory but cannot delete instances or update coins directly.
- Implement identical guest behavior and ensure stack representative/equipped selection remains stable after removal.

**Verification**

- Test first/last/duplicate copy, equipped duplicate, simultaneous salvage/equip, retry, rarity values, discovery retention, snapshot stack rebuilding, and parity.
