import {
  equipmentItems,
  equipmentItemsById,
  equipmentRarities,
} from "../constants/equipment";
import type {
  DateKey,
  EquipmentRarity,
  EquipmentStats,
  GuildQuestRewardPreview,
  HabitId,
  InventoryItem
} from "../types/app";

import type { EquipmentItemDefinition } from "../constants/equipment";

export type EquipmentLootPreview = {
  definition: EquipmentItemDefinition;
  rarity: EquipmentRarity;
  stats: EquipmentStats;
};

function selectRarity(randomValue: number, minimumRarity?: EquipmentRarity) {
  const minimumIndex = minimumRarity
    ? equipmentRarities.findIndex((rarity) => rarity.id === minimumRarity)
    : 0;
  const eligibleRarities = equipmentRarities.slice(Math.max(0, minimumIndex));
  const totalWeight = eligibleRarities.reduce((sum, rarity) => sum + rarity.weight, 0);
  const roll = Math.min(Math.max(randomValue, 0), 0.999999) * totalWeight;
  let threshold = 0;

  for (const rarity of eligibleRarities) {
    threshold += rarity.weight;
    if (roll < threshold) return rarity;
  }

  return eligibleRarities[0] ?? equipmentRarities[0];
}

function hashValue(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getEquipmentStats(definition: EquipmentItemDefinition, rarity: EquipmentRarity) {
  const rarityDefinition = equipmentRarities.find((candidate) => candidate.id === rarity) ?? equipmentRarities[0];
  const stats: EquipmentStats = {
    [definition.primaryStat]: rarityDefinition.primaryBonus
  };

  if (rarityDefinition.secondaryBonus > 0) {
    stats[definition.secondaryStat] = rarityDefinition.secondaryBonus;
  }

  return stats;
}

export function createEquipmentLootPreview(
  seed: string,
  minimumRarity: EquipmentRarity,
  savedPreview?: GuildQuestRewardPreview
): EquipmentLootPreview {
  const minimumIndex = equipmentRarities.findIndex((rarity) => rarity.id === minimumRarity);
  const savedDefinition = savedPreview ? equipmentItemsById[savedPreview.itemDefinitionId] : undefined;
  const savedRarityIndex = savedPreview
    ? equipmentRarities.findIndex((rarity) => rarity.id === savedPreview.rarity)
    : -1;
  const definition =
    savedDefinition ??
    equipmentItems[Math.floor((hashValue(`${seed}:item`) / 0x100000000) * equipmentItems.length)];
  const rarity =
    savedRarityIndex >= minimumIndex && savedPreview
      ? savedPreview.rarity
      : selectRarity(hashValue(`${seed}:rarity`) / 0x100000000, minimumRarity).id as EquipmentRarity;

  return {
    definition,
    rarity,
    stats: getEquipmentStats(definition, rarity)
  };
}

function createInstanceId(now: string, randomValue: number) {
  const randomPart = Math.floor(randomValue * Number.MAX_SAFE_INTEGER).toString(36);
  return `loot-${Date.parse(now).toString(36)}-${randomPart}`;
}

export function createEquipmentLootItem(
  source: {
    habitId?: HabitId;
    nodeId?: string;
    dateKey: DateKey;
    now?: string;
    guildQuestId?: string;
    guildPeriodKey?: DateKey;
  },
  preview: EquipmentLootPreview,
  random: () => number = Math.random
): InventoryItem {
  const now = source.now ?? new Date().toISOString();

  return {
    id: createInstanceId(now, random()),
    itemDefinitionId: preview.definition.id,
    name: preview.definition.name,
    setId: preview.definition.setId,
    setName: preview.definition.setName,
    slotId: preview.definition.slotId,
    rarity: preview.rarity,
    stats: preview.stats,
    acquiredAt: now,
    sourceHabitId: source.habitId ?? null,
    sourceNodeId: source.nodeId ?? null,
    sourceDateKey: source.dateKey,
    sourceGuildQuestId: source.guildQuestId ?? null,
    sourceGuildPeriodKey: source.guildPeriodKey ?? null
  };
}

export function rollEquipmentLoot(
  source: {
    habitId?: HabitId;
    nodeId?: string;
    dateKey: DateKey;
    now?: string;
    guildQuestId?: string;
    guildPeriodKey?: DateKey;
  },
  random: () => number = Math.random,
  minimumRarity?: EquipmentRarity
): InventoryItem {
  const now = source.now ?? new Date().toISOString();
  const itemIndex = Math.floor(Math.min(Math.max(random(), 0), 0.999999) * equipmentItems.length);
  const definition = equipmentItems[itemIndex];
  const rarity = selectRarity(random(), minimumRarity);

  return createEquipmentLootItem(
    source,
    {
      definition,
      rarity: rarity.id as EquipmentRarity,
      stats: getEquipmentStats(definition, rarity.id as EquipmentRarity)
    },
    random
  );
}
