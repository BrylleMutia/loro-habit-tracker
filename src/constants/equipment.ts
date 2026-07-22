import type { ImageSourcePropType } from "react-native";

import type {
  EquipmentAttributeId,
  EquipmentRarity,
  EquipmentSlotId
} from "../types/app";
import { images } from "./images";

export type EquipmentItemDefinition = {
  id: string;
  name: string;
  setId: string;
  setName: string;
  slotId: EquipmentSlotId;
  image: ImageSourcePropType;
  primaryStat: EquipmentAttributeId;
  secondaryStat: EquipmentAttributeId;
};

export type EquipmentRarityDefinition = {
  id: EquipmentRarity;
  label: string;
  weight: number;
  primaryBonus: number;
  secondaryBonus: number;
};

export const verdantWayfinderSet = {
  id: "verdant-wayfinder",
  name: "Verdant Wayfinder Set",
  description:
    "A practical explorer set for players beginning their adventure."
} as const;

export const emberforgeVanguardSet = {
  id: "emberforge-vanguard",
  name: "Emberforge Vanguard Set",
  description:
    "A bold warrior set representing effort, momentum, and determination."
} as const;

export const equipmentRarities: readonly EquipmentRarityDefinition[] = [
  { id: "common", label: "Common", weight: 50, primaryBonus: 1, secondaryBonus: 0 },
  { id: "uncommon", label: "Uncommon", weight: 28, primaryBonus: 1, secondaryBonus: 1 },
  { id: "rare", label: "Rare", weight: 15, primaryBonus: 2, secondaryBonus: 1 },
  { id: "epic", label: "Epic", weight: 5, primaryBonus: 3, secondaryBonus: 2 },
  { id: "legendary", label: "Legendary", weight: 2, primaryBonus: 4, secondaryBonus: 3 }
] as const;

export const verdantWayfinderItems: readonly EquipmentItemDefinition[] = [
  {
    id: "verdant-wayfinder-helmet",
    name: "Wayfinder Cap",
    setId: verdantWayfinderSet.id,
    setName: verdantWayfinderSet.name,
    slotId: "helmet",
    image: images.equipmentSets.verdantWayfinder.helmet,
    primaryStat: "intelligence",
    secondaryStat: "luck"
  },
  {
    id: "verdant-wayfinder-chest",
    name: "Trailbound Tunic",
    setId: verdantWayfinderSet.id,
    setName: verdantWayfinderSet.name,
    slotId: "chest",
    image: images.equipmentSets.verdantWayfinder.chest,
    primaryStat: "defense",
    secondaryStat: "vitality"
  },
  {
    id: "verdant-wayfinder-cape",
    name: "Verdant Travel Cape",
    setId: verdantWayfinderSet.id,
    setName: verdantWayfinderSet.name,
    slotId: "cape",
    image: images.equipmentSets.verdantWayfinder.cape,
    primaryStat: "agility",
    secondaryStat: "luck"
  },
  {
    id: "verdant-wayfinder-gloves",
    name: "Wayfinder Gloves",
    setId: verdantWayfinderSet.id,
    setName: verdantWayfinderSet.name,
    slotId: "gloves",
    image: images.equipmentSets.verdantWayfinder.gloves,
    primaryStat: "strength",
    secondaryStat: "agility"
  },
  {
    id: "verdant-wayfinder-boots",
    name: "Trailwalker Boots",
    setId: verdantWayfinderSet.id,
    setName: verdantWayfinderSet.name,
    slotId: "boots",
    image: images.equipmentSets.verdantWayfinder.boots,
    primaryStat: "agility",
    secondaryStat: "vitality"
  },
  {
    id: "verdant-wayfinder-weapon",
    name: "Compass Staff",
    setId: verdantWayfinderSet.id,
    setName: verdantWayfinderSet.name,
    slotId: "weapon",
    image: images.equipmentSets.verdantWayfinder.weapon,
    primaryStat: "strength",
    secondaryStat: "intelligence"
  },
  {
    id: "verdant-wayfinder-bag",
    name: "Wayfinder Pack",
    setId: verdantWayfinderSet.id,
    setName: verdantWayfinderSet.name,
    slotId: "bag",
    image: images.equipmentSets.verdantWayfinder.bag,
    primaryStat: "vitality",
    secondaryStat: "luck"
  },
  {
    id: "verdant-wayfinder-buddy",
    name: "Compass Wisp",
    setId: verdantWayfinderSet.id,
    setName: verdantWayfinderSet.name,
    slotId: "buddy",
    image: images.equipmentSets.verdantWayfinder.buddy,
    primaryStat: "intelligence",
    secondaryStat: "luck"
  }
] as const;

export const emberforgeVanguardItems: readonly EquipmentItemDefinition[] = [
  {
    id: "emberforge-vanguard-helmet",
    name: "Embercrest Helm",
    setId: emberforgeVanguardSet.id,
    setName: emberforgeVanguardSet.name,
    slotId: "helmet",
    image: images.equipmentSets.emberforgeVanguard.helmet,
    primaryStat: "defense",
    secondaryStat: "strength"
  },
  {
    id: "emberforge-vanguard-chest",
    name: "Vanguard Plate",
    setId: emberforgeVanguardSet.id,
    setName: emberforgeVanguardSet.name,
    slotId: "chest",
    image: images.equipmentSets.emberforgeVanguard.chest,
    primaryStat: "defense",
    secondaryStat: "vitality"
  },
  {
    id: "emberforge-vanguard-cape",
    name: "Scarlet Forge Cape",
    setId: emberforgeVanguardSet.id,
    setName: emberforgeVanguardSet.name,
    slotId: "cape",
    image: images.equipmentSets.emberforgeVanguard.cape,
    primaryStat: "agility",
    secondaryStat: "vitality"
  },
  {
    id: "emberforge-vanguard-gloves",
    name: "Emberguard Gauntlets",
    setId: emberforgeVanguardSet.id,
    setName: emberforgeVanguardSet.name,
    slotId: "gloves",
    image: images.equipmentSets.emberforgeVanguard.gloves,
    primaryStat: "strength",
    secondaryStat: "defense"
  },
  {
    id: "emberforge-vanguard-boots",
    name: "Forgemarch Boots",
    setId: emberforgeVanguardSet.id,
    setName: emberforgeVanguardSet.name,
    slotId: "boots",
    image: images.equipmentSets.emberforgeVanguard.boots,
    primaryStat: "vitality",
    secondaryStat: "agility"
  },
  {
    id: "emberforge-vanguard-weapon",
    name: "Emberforge Hammer",
    setId: emberforgeVanguardSet.id,
    setName: emberforgeVanguardSet.name,
    slotId: "weapon",
    image: images.equipmentSets.emberforgeVanguard.weapon,
    primaryStat: "strength",
    secondaryStat: "intelligence"
  },
  {
    id: "emberforge-vanguard-bag",
    name: "Vanguard Field Pack",
    setId: emberforgeVanguardSet.id,
    setName: emberforgeVanguardSet.name,
    slotId: "bag",
    image: images.equipmentSets.emberforgeVanguard.bag,
    primaryStat: "vitality",
    secondaryStat: "luck"
  },
  {
    id: "emberforge-vanguard-buddy",
    name: "Emberling Squire",
    setId: emberforgeVanguardSet.id,
    setName: emberforgeVanguardSet.name,
    slotId: "buddy",
    image: images.equipmentSets.emberforgeVanguard.buddy,
    primaryStat: "luck",
    secondaryStat: "intelligence"
  }
] as const;

export const tidesongArcanistSet = {
  id: "tidesong-arcanist",
  name: "Tidesong Arcanist Set",
  description:
    "A calm magical set inspired by learning, reflection, hydration, and rest."
} as const;

export const equipmentSets = [
  verdantWayfinderSet,
  emberforgeVanguardSet,
  tidesongArcanistSet
] as const;

export const tidesongArcanistItems: readonly EquipmentItemDefinition[] = [
  {
    id: "tidesong-arcanist-helmet",
    name: "Moonlit Scholar Hood",
    setId: tidesongArcanistSet.id,
    setName: tidesongArcanistSet.name,
    slotId: "helmet",
    image: images.equipmentSets.tidesongArcanist.helmet,
    primaryStat: "intelligence",
    secondaryStat: "luck"
  },
  {
    id: "tidesong-arcanist-chest",
    name: "Tidesong Arcanist Robe",
    setId: tidesongArcanistSet.id,
    setName: tidesongArcanistSet.name,
    slotId: "chest",
    image: images.equipmentSets.tidesongArcanist.chest,
    primaryStat: "intelligence",
    secondaryStat: "vitality"
  },
  {
    id: "tidesong-arcanist-cape",
    name: "Moonwave Cape",
    setId: tidesongArcanistSet.id,
    setName: tidesongArcanistSet.name,
    slotId: "cape",
    image: images.equipmentSets.tidesongArcanist.cape,
    primaryStat: "agility",
    secondaryStat: "intelligence"
  },
  {
    id: "tidesong-arcanist-gloves",
    name: "Tidesong Rune Gloves",
    setId: tidesongArcanistSet.id,
    setName: tidesongArcanistSet.name,
    slotId: "gloves",
    image: images.equipmentSets.tidesongArcanist.gloves,
    primaryStat: "intelligence",
    secondaryStat: "agility"
  },
  {
    id: "tidesong-arcanist-boots",
    name: "Moonstep Boots",
    setId: tidesongArcanistSet.id,
    setName: tidesongArcanistSet.name,
    slotId: "boots",
    image: images.equipmentSets.tidesongArcanist.boots,
    primaryStat: "agility",
    secondaryStat: "vitality"
  },
  {
    id: "tidesong-arcanist-weapon",
    name: "Crescent Tide Staff",
    setId: tidesongArcanistSet.id,
    setName: tidesongArcanistSet.name,
    slotId: "weapon",
    image: images.equipmentSets.tidesongArcanist.weapon,
    primaryStat: "intelligence",
    secondaryStat: "luck"
  },
  {
    id: "tidesong-arcanist-bag",
    name: "Scholar Tide Satchel",
    setId: tidesongArcanistSet.id,
    setName: tidesongArcanistSet.name,
    slotId: "bag",
    image: images.equipmentSets.tidesongArcanist.bag,
    primaryStat: "vitality",
    secondaryStat: "intelligence"
  },
  {
    id: "tidesong-arcanist-buddy",
    name: "Pearlfin Droplet",
    setId: tidesongArcanistSet.id,
    setName: tidesongArcanistSet.name,
    slotId: "buddy",
    image: images.equipmentSets.tidesongArcanist.buddy,
    primaryStat: "luck",
    secondaryStat: "vitality"
  }
] as const;

export const equipmentItems: readonly EquipmentItemDefinition[] = [
  ...verdantWayfinderItems,
  ...emberforgeVanguardItems,
  ...tidesongArcanistItems
] as const;

export const equipmentItemsById = Object.fromEntries(
  equipmentItems.map((item) => [item.id, item])
) as Record<string, EquipmentItemDefinition>;

export const equipmentRaritiesById = Object.fromEntries(
  equipmentRarities.map((rarity) => [rarity.id, rarity])
) as Record<EquipmentRarity, EquipmentRarityDefinition>;
