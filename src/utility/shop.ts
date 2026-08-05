import { shopItems, shopItemsById } from "../constants/shop";
import type {
  ActiveBuff,
  DateKey,
  ShopItemId,
  ShopItemStatus,
  ShopState
} from "../types/app";
import { getStartOfDateInTimeZone } from "./guildQuests";
import { getShopPeriodEndDateKey, getShopPeriodKey } from "./shopPeriod";

export { getShopPeriodEndDateKey, getShopPeriodKey } from "./shopPeriod";

export function getShopPeriodExpiresAt(dateKey: DateKey, timeZone: string) {
  return getStartOfDateInTimeZone(
    getShopPeriodEndDateKey(dateKey),
    timeZone
  ).toISOString();
}

function getDefaultStatus(item: (typeof shopItems)[number]): ShopItemStatus {
  return {
    id: item.id,
    priceCoins: item.priceCoins,
    purchasesThisPeriod: 0,
    remainingPurchases: item.weeklyLimit,
    weeklyLimit: item.weeklyLimit
  };
}

export function createInitialShopState(dateKey: DateKey): ShopState {
  return {
    periodKey: getShopPeriodKey(dateKey),
    items: shopItems.map(getDefaultStatus)
  };
}

export function refreshShopState(
  shop: ShopState | undefined,
  dateKey: DateKey
): ShopState {
  const periodKey = getShopPeriodKey(dateKey);
  if (!shop || shop.periodKey !== periodKey) return createInitialShopState(dateKey);

  return {
    periodKey,
    items: shopItems.map((item) => {
      const current = shop.items.find((candidate) => candidate.id === item.id);
      if (!current) return getDefaultStatus(item);

      const purchasesThisPeriod = Math.min(
        Math.max(current.purchasesThisPeriod, 0),
        item.weeklyLimit
      );
      return {
        id: item.id,
        priceCoins: Math.max(current.priceCoins, 0),
        purchasesThisPeriod,
        remainingPurchases: item.weeklyLimit - purchasesThisPeriod,
        weeklyLimit: item.weeklyLimit
      };
    })
  };
}

export function getShopItemStatus(shop: ShopState, itemId: ShopItemId) {
  return (
    shop.items.find((item) => item.id === itemId) ??
    getDefaultStatus(shopItemsById[itemId])
  );
}

export function getActiveXpCharmUses(
  activeBuffs: readonly ActiveBuff[],
  now = new Date()
) {
  const buff = activeBuffs.find(
    (candidate) =>
      candidate.id === "xp-charm" &&
      candidate.remainingUses > 0 &&
      Date.parse(candidate.expiresAt) > now.getTime()
  );
  return buff?.remainingUses ?? 0;
}

export function removeExpiredShopBuffs(
  activeBuffs: readonly ActiveBuff[],
  now = new Date()
) {
  const remaining = activeBuffs.filter(
    (buff) => Date.parse(buff.expiresAt) > now.getTime()
  );
  return remaining.length === activeBuffs.length ? [...activeBuffs] : remaining;
}

export function createShopPurchaseIdempotencyKey() {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) return randomUuid;

  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
