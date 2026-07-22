import { equipmentItems, equipmentSets } from "../constants/equipment";
import { loadoutSlots } from "../constants/profile";
import type { InventoryItem } from "../types/app";

export type EquipmentSetProgress = {
  setId: string;
  setName: string;
  collectedCount: number;
  requiredCount: number;
  isComplete: boolean;
};

export function normalizeEquipmentSetOrder(order: readonly string[] | undefined) {
  const knownSetIds = new Set<string>(equipmentSets.map((set) => set.id));
  const seenSetIds = new Set<string>();
  const normalizedOrder: string[] = [];

  for (const setId of order ?? []) {
    if (knownSetIds.has(setId) && !seenSetIds.has(setId)) {
      normalizedOrder.push(setId);
      seenSetIds.add(setId);
    }
  }

  for (const set of equipmentSets) {
    if (!seenSetIds.has(set.id)) {
      normalizedOrder.push(set.id);
    }
  }

  return normalizedOrder;
}

export function getEquipmentSetProgress(
  setId: string,
  discoveredItemDefinitionIds: readonly string[]
): EquipmentSetProgress {
  const set = equipmentSets.find((candidate) => candidate.id === setId);
  const itemDefinitions = equipmentItems.filter((item) => item.setId === setId);
  const discoveredIds = new Set(discoveredItemDefinitionIds);
  const collectedCount = itemDefinitions.filter((item) => discoveredIds.has(item.id)).length;

  return {
    setId,
    setName: set?.name ?? setId,
    collectedCount,
    requiredCount: itemDefinitions.length,
    isComplete: itemDefinitions.length > 0 && collectedCount === itemDefinitions.length
  };
}

export function getEquipmentSetProgressList(
  discoveredItemDefinitionIds: readonly string[]
): EquipmentSetProgress[] {
  return equipmentSets.map((set) =>
    getEquipmentSetProgress(set.id, discoveredItemDefinitionIds)
  );
}

export function getOrderedEquipmentSetProgressList(
  discoveredItemDefinitionIds: readonly string[],
  order: readonly string[] | undefined
): EquipmentSetProgress[] {
  const progressBySetId = new Map(
    getEquipmentSetProgressList(discoveredItemDefinitionIds).map((progress) => [
      progress.setId,
      progress
    ])
  );

  return normalizeEquipmentSetOrder(order).flatMap((setId) => {
    const progress = progressBySetId.get(setId);
    return progress ? [progress] : [];
  });
}

export function getFullyEquippedSetId(
  equippedItemIds: readonly string[],
  inventoryItems: readonly InventoryItem[]
): string | null {
  if (equippedItemIds.length < loadoutSlots.length) return null;

  const inventoryById = new Map(inventoryItems.map((item) => [item.id, item]));
  const equippedItems = loadoutSlots.map((slot) => {
    const itemId = equippedItemIds[slot.sortOrder];
    const item = itemId ? inventoryById.get(itemId) : undefined;
    return item && item.slotId === slot.id ? item : null;
  });

  if (equippedItems.some((item) => item === null)) return null;

  const setIds = new Set(equippedItems.map((item) => item?.setId));
  if (setIds.size !== 1) return null;

  const setId = equippedItems[0]?.setId;
  if (!setId) return null;

  const requiredDefinitions = equipmentItems.filter((item) => item.setId === setId);
  const equippedDefinitionIds = new Set(
    equippedItems.map((item) => item?.itemDefinitionId).filter((id): id is string => Boolean(id))
  );

  return requiredDefinitions.length === loadoutSlots.length &&
    requiredDefinitions.every((item) => equippedDefinitionIds.has(item.id))
    ? setId
    : null;
}
