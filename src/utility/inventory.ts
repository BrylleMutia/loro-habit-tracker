import type {
  EquipmentRarity,
  InventoryItem,
  InventoryStack
} from "../types/app";

export type InventorySortKey = "rarity" | "acquired" | "value" | "set";
export type InventorySortDirection = "asc" | "desc";

const rarityRank: Record<EquipmentRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5
};

const rarityValue: Record<EquipmentRarity, number> = {
  common: 10,
  uncommon: 25,
  rare: 60,
  epic: 150,
  legendary: 400
};

function getTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function getInventoryItemValue(item: InventoryItem) {
  return rarityValue[item.rarity] + Object.values(item.stats).reduce((sum, value) => sum + value, 0) * 5;
}

export function getInventoryStackKey(item: InventoryItem) {
  return `${item.itemDefinitionId}:${item.rarity}`;
}

function compareItems(first: InventoryItem, second: InventoryItem, sortKey: InventorySortKey) {
  if (sortKey === "rarity") {
    return rarityRank[first.rarity] - rarityRank[second.rarity];
  }
  if (sortKey === "acquired") {
    return getTimestamp(first.acquiredAt) - getTimestamp(second.acquiredAt);
  }
  if (sortKey === "value") {
    return getInventoryItemValue(first) - getInventoryItemValue(second);
  }
  return first.setName.localeCompare(second.setName);
}

export function groupInventoryItems(
  items: readonly InventoryItem[],
  equippedItemIds: readonly string[],
  sortKey: InventorySortKey,
  direction: InventorySortDirection
) {
  const groups = new Map<string, InventoryItem[]>();

  items.forEach((item) => {
    const groupKey = getInventoryStackKey(item);
    const group = groups.get(groupKey);

    if (group) {
      group.push(item);
      return;
    }

    groups.set(groupKey, [item]);
  });

  return Array.from(groups.entries())
    .map(([key, groupItems]): InventoryStack => {
      const sortedByRecent = [...groupItems].sort(
        (first, second) => getTimestamp(second.acquiredAt) - getTimestamp(first.acquiredAt)
      );
      const representative = sortedByRecent[0];
      const firstAcquiredAt = [...groupItems].sort(
        (first, second) => getTimestamp(first.acquiredAt) - getTimestamp(second.acquiredAt)
      )[0].acquiredAt;
      const equippedItem = groupItems.find((item) => equippedItemIds.includes(item.id)) ?? null;
      const itemValue = getInventoryItemValue(representative);

      return {
        key,
        items: groupItems,
        representative,
        quantity: groupItems.length,
        firstAcquiredAt,
        itemValue,
        totalValue: itemValue * groupItems.length,
        isEquipped: equippedItem !== null,
        equippedItemId: equippedItem?.id ?? null
      };
    })
    .sort((first, second) => {
      const result = compareItems(first.representative, second.representative, sortKey);
      if (result !== 0) return direction === "desc" ? -result : result;
      const nameResult = first.representative.name.localeCompare(second.representative.name);
      if (nameResult !== 0) return nameResult;
      return first.key.localeCompare(second.key);
    });
}
