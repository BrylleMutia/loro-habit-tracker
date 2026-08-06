# Feature #38 - "New" Badge on Recently Acquired Items (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-38)

### <a id="feature-38"></a>38. "New" Badge on Recently Acquired Items (P2)

**What:** Show a pulsing dot or "NEW" badge on inventory items acquired since the player last visited the Stash tab.

**Why:** Items have `acquiredAt` timestamps but no discovery indicator. A new-item badge drives excitement and ensures players don't miss loot they earned.

**Implementation notes:**
- Treat "seen" state as device-local presentation state rather than durable game state. Store seen inventory item IDs or a visit watermark in the existing per-user cache.
- In `InventoryStashGrid`, capture unseen items when the tab opens and mark them seen after they have been rendered, so badges do not disappear before the player can see them.
- Show a small pulsing dot or "NEW" ribbon on matching items
- Badge clears after the item has been presented in Stash.
- Use Reanimated for a subtle pulse animation on the dot

---

## Delivery Blueprint — Phase 5 — Celebration, Inventory, and Sync Polish

### <a id="blueprint-feature-38"></a>Feature #38 — Newly Acquired Item Indicators

**State ownership**

- Store seen inventory instance IDs in the existing per-user device cache. This is presentation history, not server-authoritative game state.
- On Stash focus, compute unseen IDs from the current inventory and freeze that list for the visible session. Mark them seen after the grid renders or when the user leaves the tab.
- Prune seen IDs that are no longer relevant to bound storage, while preserving enough history that old items do not reappear as new after ordinary sync.
- Namespace the cache by user/guest ID and clear/switch it correctly on account changes.

**UI**

- Show a small “NEW” badge on affected stack cards and a neutral numeric/dot badge on the Stash tab.
- If a stack contains multiple new instances, one badge is enough; item details may state the new quantity.
- Respect reduced motion: pulse is optional, static badge is fully sufficient.

**Verification**

- Test item acquired while Stash mounted/unmounted, multiple duplicates, account switch, salvage before seen, offline cached inventory, reload, and no badge interception of taps.
