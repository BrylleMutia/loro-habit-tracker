# Feature #5 - Shop Tab (P1)

> Roadmap index: [PLANS.md](../PLANS.md#feature-5)

### <a id="feature-5"></a>5. Shop Tab (P1)

**Status: Partial**

**What:** A Stash-owned shop where players spend coins on weekly supplies that enhance gameplay without changing the core habit requirements.

**Why:** Coins currently have no spend outlet beyond psychological satisfaction. A shop closes the economy loop.

**Dependency gate:** Feature #5 remains blocked from shipping any shield purchase until Feature #4's authenticated/guest parity, idempotency, and concurrency verification is deployed and accepted.

**Shop inventory:**
| Item | Cost | Weekly limit | Effect |
|------|------|--------------|--------|
| Streak Shield | 200 🪙 | 3 | Protects streak for one eligible missed day |
| Energy Elixir | 150 🪙 | 3 | Restores 3 energy instantly, capped at max |
| XP Charm | 150 🪙 | 3 | 2× XP for the next 3 Daily Quest completions; charges expire Sunday |
| Lory Scarf (Green) | 100 🪙 | n/a | Cosmetic — Lory wears a green scarf on Home |
| Lory Hat (Explorer) | 150 🪙 | n/a | Cosmetic — Lory wears an explorer hat |

**Implementation notes:**
- Keep the five-tab navigation. The implemented first slice renders an inline Shop section under Stash instead of adding a sixth bottom tab.
- Create a `ShopScreen` or screen-local Shop view with catalog, affordability, owned state, and purchase confirmation.
- Shop catalog constant in `src/constants/shop.ts`
- Add a transactional purchase RPC for authenticated users and equivalent local-repository intent for guests; the server must calculate prices/effects and validate sufficient coins.
- Weekly purchase counts use a Sunday boundary in the user's configured timezone and are backed by an idempotent purchase ledger.
- The XP Charm is represented by a use-count `ActiveBuff`; each purchase adds three charges, Daily Quest completion consumes one, and unused charges expire at the weekly boundary.
- Cosmetic items are planned to be stored in a new `cosmetics` array on `PlayerProfile`.

**Implemented first slice:**

- Streak Shield, Energy Elixir, and XP Charm are available in the Stash Shop section with authoritative prices, weekly remaining counts, affordability states, and active XP-charge display.
- Authenticated purchases use a locked, idempotent RPC and server catalog; guests use equivalent local repository rules.
- The remaining roadmap work is permanent Lory cosmetics and their ownership/equipped presentation.

---

## Delivery Blueprint — Phase 1 — Complete the P1 Core Experience

### <a id="blueprint-feature-5"></a>Feature #5 — Coin Shop

**Product and UX**

- Keep five bottom tabs. Add a `Stash | Shop` segmented view or an internal Shop destination from Stash/More.
- Catalog cards show icon/art, effect, price, owned/active state, affordability, and a concise confirmation. Consumables and cosmetics must be visually distinct.
- Disable purchase while another economy mutation is in flight. On failure, preserve the prior snapshot and show retry guidance through the existing sync/error surface.
- Keep the first catalog small: Streak Shield, Energy Elixir, XP Charm, and two Lory cosmetics. Do not introduce rotating stock, trading, or real-money currency in the first slice.

**Client and domain**

- Add typed `ShopItemDefinition` discriminated unions for `consumable`, `buff`, and `cosmetic` effects in `src/types/app.ts`; catalog presentation may live in `src/constants/shop.ts`.
- Add `purchaseShopItem(itemId, idempotencyKey)` to game actions and a `"shop-purchase"` mutation ID.
- Create pure helpers for price formatting, ownership, active-buff state, and catalog grouping. Screens must not apply effects or subtract coins.
- Model XP Charm by completion count rather than only an expiration timestamp if its rule is “next three completions.” Use a typed buff payload such as `remainingUses`.
- Store Lory cosmetics separately from equipment slots and add a single equipped cosmetic per supported cosmetic slot.

**Backend and data**

- Prefer a server catalog table for price/effect authority, with a checked item kind and JSON payload validated by the purchase RPC. The client constant may mirror art/copy but not determine price.
- Add purchase and cosmetic-ownership ledgers with unique constraints for non-consumables.
- `purchase_shop_item` locks the profile, validates catalog availability and coins, applies exactly one effect, records the purchase, and returns a new snapshot.
- The RPC calculates prices/effects; it rejects client-supplied prices, rewards, buff values, or cosmetic ownership.
- Add indexes for `(user_id, purchased_at desc)` and active-buff lookups. RLS allows users to read their own purchases/ownership but not write directly.
- Implement equivalent guest behavior in `localGameRepository.ts`.

**Verification**

- Test insufficient funds, exact funds, duplicate idempotency key, simultaneous purchases, energy cap, buff stacking policy, non-consumable repurchase prevention, and guest/remote parity.
- Verify catalog cards at large text sizes and with sound/haptics disabled.
