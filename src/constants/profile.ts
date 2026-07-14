import type { IconName } from "../types/app";

export type EquipmentAttributeId =
  | "agility"
  | "defense"
  | "intelligence"
  | "luck"
  | "strength"
  | "vitality";

export type EquipmentAttributeDefinition = {
  id: EquipmentAttributeId;
  label: string;
  icon: IconName;
};

export type LoadoutSlotDefinition = {
  label: string;
  icon: IconName;
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
  { label: "Hat", icon: "baseball-outline", attributeId: "intelligence", attributeValue: 1 },
  { label: "Cape", icon: "shirt-outline", attributeId: "defense", attributeValue: 1 },
  { label: "Tool", icon: "brush-outline", attributeId: "intelligence", attributeValue: 1 },
  { label: "Back", icon: "bag-outline", attributeId: "vitality", attributeValue: 1 },
  { label: "Face", icon: "glasses-outline", attributeId: "luck", attributeValue: 1 },
  { label: "Body", icon: "body-outline", attributeId: "strength", attributeValue: 2 },
  { label: "Feet", icon: "footsteps-outline", attributeId: "agility", attributeValue: 1 },
  { label: "Buddy", icon: "paw-outline", attributeId: "luck", attributeValue: 2 }
];
