import type { EquipmentAttributeId, EquipmentSlotId, IconName } from "../types/app";

export type EquipmentAttributeDefinition = {
  id: EquipmentAttributeId;
  label: string;
  icon: IconName;
};

export type LoadoutSlotDefinition = {
  id: EquipmentSlotId;
  label: string;
  icon: IconName;
  sortOrder: number;
  attributeId: EquipmentAttributeId;
  attributeValue: number;
};

export type ProfileBadgeId = "new-adventurer" | "first-quest" | "week-streak" | "chapter-one";

export type ProfileBadgeDefinition = {
  id: ProfileBadgeId;
  label: string;
  icon: IconName;
  tone: "primary" | "success" | "reward" | "danger";
};

export const profileBadges: ProfileBadgeDefinition[] = [
  { id: "new-adventurer", label: "New Adventurer", icon: "compass", tone: "primary" },
  { id: "first-quest", label: "First Quest", icon: "checkmark", tone: "success" },
  { id: "week-streak", label: "Seven Day Spark", icon: "flame", tone: "danger" },
  { id: "chapter-one", label: "Chapter Hero", icon: "trophy", tone: "reward" }
];

export const equipmentAttributes: EquipmentAttributeDefinition[] = [
  { id: "strength", label: "Strength", icon: "barbell-outline" },
  { id: "agility", label: "Agility", icon: "speedometer-outline" },
  { id: "intelligence", label: "Intelligence", icon: "bulb-outline" },
  { id: "defense", label: "Defense", icon: "shield-checkmark-outline" },
  { id: "vitality", label: "Vitality", icon: "heart-outline" },
  { id: "luck", label: "Luck", icon: "sparkles-outline" }
];

export const loadoutSlots: LoadoutSlotDefinition[] = [
  {
    id: "helmet",
    label: "Helmet",
    icon: "shield-half-outline",
    sortOrder: 0,
    attributeId: "intelligence",
    attributeValue: 1
  },
  {
    id: "chest",
    label: "Chest",
    icon: "body-outline",
    sortOrder: 1,
    attributeId: "defense",
    attributeValue: 1
  },
  {
    id: "cape",
    label: "Cape",
    icon: "layers-outline",
    sortOrder: 2,
    attributeId: "intelligence",
    attributeValue: 1
  },
  {
    id: "gloves",
    label: "Gloves",
    icon: "hand-left-outline",
    sortOrder: 3,
    attributeId: "vitality",
    attributeValue: 1
  },
  {
    id: "boots",
    label: "Boots",
    icon: "footsteps-outline",
    sortOrder: 4,
    attributeId: "luck",
    attributeValue: 1
  },
  {
    id: "weapon",
    label: "Weapon",
    icon: "hammer-outline",
    sortOrder: 5,
    attributeId: "strength",
    attributeValue: 2
  },
  {
    id: "bag",
    label: "Bag",
    icon: "bag-outline",
    sortOrder: 6,
    attributeId: "agility",
    attributeValue: 1
  },
  {
    id: "buddy",
    label: "Buddy",
    icon: "paw-outline",
    sortOrder: 7,
    attributeId: "luck",
    attributeValue: 2
  }
];
