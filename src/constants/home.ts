import type { TabItem } from "../types/app";

export const moreTab: TabItem = { id: "more", label: "More", icon: "menu-outline" };

export const tabs: TabItem[] = [
  { id: "profile", label: "Profile", icon: "person-outline" },
  { id: "stash", label: "Stash", icon: "bag-handle-outline" },
  { id: "home", label: "Home", icon: "home-outline" },
  { id: "guild", label: "Guild", icon: "shield-outline" },
  moreTab
];

export const defaultTabId: TabItem["id"] = "home";
