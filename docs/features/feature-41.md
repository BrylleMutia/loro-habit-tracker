# Feature #41 - Tap Loot Preview in Celebration Modal for Item Details (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-41)

### <a id="feature-41"></a>41. Tap Loot Preview in Celebration Modal for Item Details (P2)

**What:** The inline loot item preview inside `QuestCelebrationModal` becomes tappable. Tapping opens `InventoryStackDetailsModal` showing the full item with an equip action, without adding any new buttons to the celebration flow.

**Why:** The inline preview card already shows the item image, rarity, name, and stats — but doesn't let the player inspect details or equip it. Adding a tap target on the existing preview avoids UI clutter while giving immediate agency over new loot.

**Implementation notes:**
- ✅ Completed for loot previews and equipped items on Profile: both entry points use the shared inventory stack builder and `InventoryStackDetailsModal`.
- ✅ The celebration coordinator temporarily swaps to item details and restores the exact loot-celebration page after close; equip/unequip uses the existing mutation path.
- ✅ Wrap the inline loot card in `LootDropCelebration` with an accessible `TouchableOpacity` tap target.
- ✅ Convert the single loot instance with the shared inventory-stack utility before opening details; no `InventoryItem` to `InventoryStack` cast is used.
- ✅ Wire `onEquip` through `useGameActions()` and close the details modal on success.
- ✅ Swap from the loot celebration to item details and restore the exact celebration page on close, avoiding nested native modals.
- ✅ Reuse `InventoryStackDetailsModal` for equipped item taps on Profile, including equip/unequip and syncing state.
- ✅ Keep the preview card as the only item-details affordance; no additional button was added.

---

## Delivery Blueprint — Phase 5 — Celebration, Inventory, and Sync Polish

### <a id="blueprint-feature-41"></a>Feature #41 — Loot Detail from Celebration

**Interaction**
- ✅ Loot previews and equipped Profile items now open the shared detail modal; the underlying celebration page is restored after inspection.

- ✅ Make the existing loot preview card a `TouchableOpacity` with button semantics and an accessibility label to open item details.
- ✅ Use the shared inventory stack builder to create a one-item stack, including equipped status from the latest snapshot.
- ✅ The celebration coordinator swaps from the loot step to item details and restores the exact celebration step on close; no native `Modal` instances are stacked.
- ✅ Equip/unequip remains the existing server/local intent. Disable the action while syncing and refresh the detail state from the returned snapshot.
- ✅ Closing details never dismisses or restarts the underlying celebration.

**Verification**

- Test no loot, every rarity, open/close repeatedly, equip/unequip, network error, already-equipped item, Android back, screen reader focus restoration, and modal queue integration.
