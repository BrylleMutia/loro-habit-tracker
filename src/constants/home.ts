import type { TabItem } from "../types/app";

export const tabs: TabItem[] = [
  { id: "profile", label: "Profile", icon: "person-outline" },
  { id: "shop", label: "Shop", icon: "bag-handle-outline" },
  { id: "home", label: "Home", icon: "home-outline" },
  { id: "quests", label: "Quests", icon: "trophy-outline" },
  { id: "more", label: "More", icon: "menu-outline" }
];

export const defaultTabId: TabItem["id"] = "home";
