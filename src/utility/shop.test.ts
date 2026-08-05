import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { shopItems } from "../constants/shop.ts";
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { ENERGY_REFILL_INTERVAL_MS, getEffectiveEnergyCurrent } from "./energy.ts";
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { getShopPeriodEndDateKey, getShopPeriodKey } from "./shopPeriod.ts";

test("shop catalog uses the requested prices and weekly limits", () => {
  assert.deepEqual(
    shopItems.map(({ id, priceCoins, weeklyLimit }) => ({ id, priceCoins, weeklyLimit })),
    [
      { id: "streak-shield", priceCoins: 200, weeklyLimit: 3 },
      { id: "energy-elixir", priceCoins: 150, weeklyLimit: 3 },
      { id: "xp-charm", priceCoins: 150, weeklyLimit: 3 }
    ]
  );
});

test("shop weeks start on Sunday and reset at the next Sunday", () => {
  assert.equal(getShopPeriodKey("2026-08-06"), "2026-08-02");
  assert.equal(getShopPeriodEndDateKey("2026-08-06"), "2026-08-09");
});

test("energy display accounts for passive refill without exceeding max", () => {
  const now = Date.parse("2026-08-06T12:00:00.000Z");
  const lastRefillAt = new Date(now - ENERGY_REFILL_INTERVAL_MS * 4).toISOString();
  assert.equal(
    getEffectiveEnergyCurrent(
      { current: 4, max: 10, lastRefillAt },
      now
    ),
    8
  );
  assert.equal(
    getEffectiveEnergyCurrent(
      { current: 9, max: 10, lastRefillAt: new Date(now - ENERGY_REFILL_INTERVAL_MS * 4).toISOString() },
      now
    ),
    10
  );
});
