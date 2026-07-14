import type { IconName } from "../types/app";

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

export const loadoutSlots: Array<{ label: string; icon: IconName }> = [
  { label: "Hat", icon: "baseball-outline" },
  { label: "Cape", icon: "shirt-outline" },
  { label: "Tool", icon: "brush-outline" },
  { label: "Back", icon: "bag-outline" },
  { label: "Face", icon: "glasses-outline" },
  { label: "Body", icon: "body-outline" },
  { label: "Feet", icon: "footsteps-outline" },
  { label: "Buddy", icon: "paw-outline" }
];
