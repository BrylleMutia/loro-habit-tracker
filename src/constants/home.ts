import { Ionicons } from "@expo/vector-icons";

export type TabId = "home" | "quests" | "shop" | "profile" | "more";
export type HabitId = "sketching" | "fitness" | "reading" | "guitar";
export type PathStatus = "done" | "active" | "locked" | "bonus";
export type IconName = keyof typeof Ionicons.glyphMap;

export type TabItem = {
  id: TabId;
  label: string;
  icon: IconName;
};

export type HabitChip = {
  id: HabitId;
  label: string;
  icon: IconName;
};

export type PathItem = {
  id: string;
  title: string;
  duration: string;
  icon: IconName;
  status: PathStatus;
};

export const tabs: TabItem[] = [
  { id: "home", label: "Home", icon: "home-outline" },
  { id: "quests", label: "Quests", icon: "trophy-outline" },
  { id: "shop", label: "Shop", icon: "bag-handle-outline" },
  { id: "profile", label: "Profile", icon: "person-outline" },
  { id: "more", label: "More", icon: "menu-outline" }
];

export const habitChips: HabitChip[] = [
  { id: "fitness", label: "Fitness", icon: "barbell-outline" },
  { id: "reading", label: "Reading", icon: "book-outline" },
  { id: "guitar", label: "Guitar", icon: "musical-notes-outline" }
];

export const pathItems: PathItem[] = [
  { id: "warmup", title: "Warm-Up Sketch", duration: "5 min", icon: "brush-outline", status: "done" },
  { id: "daily", title: "Daily Sketch", duration: "15 min", icon: "create-outline", status: "active" },
  { id: "shade", title: "Shading Basics", duration: "10 min", icon: "cube-outline", status: "locked" },
  { id: "bonus", title: "Bonus Chest", duration: "Complete all 7 days", icon: "gift-outline", status: "bonus" }
];

export const userStats = {
  name: "Brylle",
  hearts: 5,
  coins: "1,240",
  activeHabit: "Sketching",
  currentDay: "Day 4 of 7"
} as const;
