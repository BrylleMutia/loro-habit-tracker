import { loadoutSlots } from "../constants/profile";
import type { EquipmentAttributeId, HabitState, InventoryItem } from "../types/app";

export type EquipmentAttributeTotals = Record<EquipmentAttributeId, number>;

export function getEquipmentAttributeTotals(
  equippedItemIds: readonly string[],
  inventoryItems: readonly InventoryItem[] = []
): EquipmentAttributeTotals {
  const totals: EquipmentAttributeTotals = {
    agility: 0,
    defense: 0,
    intelligence: 0,
    luck: 0,
    strength: 0,
    vitality: 0
  };

  const inventoryById = new Map(inventoryItems.map((item) => [item.id, item]));

  loadoutSlots.forEach((slot) => {
    const equippedItemId = equippedItemIds[slot.sortOrder];
    const equippedItem = equippedItemId ? inventoryById.get(equippedItemId) : undefined;

    if (equippedItem) {
      Object.entries(equippedItem.stats).forEach(([attributeId, amount]) => {
        totals[attributeId as EquipmentAttributeId] += amount;
      });
    } else if (equippedItemId) {
      // Keep older snapshots readable while they migrate from catalog IDs to item-instance IDs.
      totals[slot.attributeId] += slot.attributeValue;
    }
  });

  return totals;
}

export function getProfileActivityStatistics(habits: readonly HabitState[]) {
  const activeDateKeys = new Set<string>();
  let completedChapters = 0;
  let completedQuests = 0;
  let totalTrackedSeconds = 0;

  habits.forEach((habit) => {
    completedChapters += habit.claimedChapterRewardIds.length;
    completedQuests += habit.completions.length;

    habit.completions.forEach((completion) => {
      activeDateKeys.add(completion.completedOn);

      const section = habit.sections.find(({ id }) => id === completion.sectionId);
      const node = section?.nodes.find(({ id }) => id === completion.nodeId);

      if (node?.questType === "timed") {
        totalTrackedSeconds += node.targetDurationSeconds;
      }
    });
  });

  return {
    activeDays: activeDateKeys.size,
    completedChapters,
    completedQuests,
    totalTrackedSeconds
  };
}

export function formatTrackedHours(totalTrackedSeconds: number) {
  const hours = Math.max(totalTrackedSeconds, 0) / 3600;
  const formattedHours = hours.toFixed(1).replace(".0", "");

  return `${formattedHours}h`;
}
