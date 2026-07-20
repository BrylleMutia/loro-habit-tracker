import {
  equipmentItems,
  equipmentRarities,
} from "../constants/equipment";
import type {
  DateKey,
  EquipmentRarity,
  EquipmentStats,
  HabitId,
  InventoryItem
} from "../types/app";

function selectRarity(randomValue: number) {
  const roll = Math.min(Math.max(randomValue, 0), 0.999999) * 100;
  let threshold = 0;

  for (const rarity of equipmentRarities) {
    threshold += rarity.weight;
    if (roll < threshold) return rarity;
  }

  return equipmentRarities[0];
}

function createInstanceId(now: string, randomValue: number) {
  const randomPart = Math.floor(randomValue * Number.MAX_SAFE_INTEGER).toString(36);
  return `loot-${Date.parse(now).toString(36)}-${randomPart}`;
}

export function rollEquipmentLoot(
  source: {
    habitId: HabitId;
    nodeId: string;
    dateKey: DateKey;
    now?: string;
  },
  random: () => number = Math.random
): InventoryItem {
  const now = source.now ?? new Date().toISOString();
  const itemIndex = Math.floor(Math.min(Math.max(random(), 0), 0.999999) * equipmentItems.length);
  const definition = equipmentItems[itemIndex];
  const rarity = selectRarity(random());
  const stats: EquipmentStats = {
    [definition.primaryStat]: rarity.primaryBonus
  };

  if (rarity.secondaryBonus > 0) {
    stats[definition.secondaryStat] = rarity.secondaryBonus;
  }

  return {
    id: createInstanceId(now, random()),
    itemDefinitionId: definition.id,
    name: definition.name,
    setId: definition.setId,
    setName: definition.setName,
    slotId: definition.slotId,
    rarity: rarity.id as EquipmentRarity,
    stats,
    acquiredAt: now,
    sourceHabitId: source.habitId,
    sourceNodeId: source.nodeId,
    sourceDateKey: source.dateKey
  };
}
