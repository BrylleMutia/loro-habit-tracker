import { Ionicons } from "@expo/vector-icons";

export type TabId = "home" | "quests" | "shop" | "profile" | "more";
export type HabitId = "exercise" | "reading" | "water" | "sleep";
export type PathStatus = "done" | "active" | "locked" | "bonus";
export type IconName = keyof typeof Ionicons.glyphMap;

export type TabItem = {
  id: TabId;
  label: string;
  icon: IconName;
};

export type PathItem = {
  id: string;
  title: string;
  duration: string;
  icon: IconName;
  status: PathStatus;
  rewardCoins: number;
  rewardXp: number;
  progressAmount: number;
};

export type HabitProgress = {
  current: number;
  target: number;
  unit: string;
};

export type HabitState = {
  id: HabitId;
  label: string;
  icon: IconName;
  dailyPrompt: string;
  level: number;
  xp: number;
  streak: number;
  progress: HabitProgress;
  pathItems: PathItem[];
};

export type PlayerProfile = {
  id: string;
  name: string;
  joinedAt: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  equippedItemIds: string[];
};

export type EnergyState = {
  current: number;
  max: number;
  lessonCost: number;
  lastRefillAt: string | null;
};

export type DailyCheckInState = {
  claimedToday: boolean;
  lastClaimedAt: string | null;
  rewardCoins: number;
  rewardEnergy: number;
};

export type ActiveBuff = {
  id: string;
  label: string;
  expiresAt: string;
};

export type InventoryState = {
  ownedItemIds: string[];
  streakShields: number;
  activeBuffs: ActiveBuff[];
};

export type AppSettings = {
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
};

export type ActivityLogEntry = {
  id: string;
  habitId: HabitId;
  pathItemId: string;
  completedAt: string;
  coinsEarned: number;
  xpEarned: number;
};

export type AppState = {
  activeTab: TabId;
  activeHabitId: HabitId;
  profile: PlayerProfile;
  habits: Record<HabitId, HabitState>;
  dailyStreak: number;
  longestStreak: number;
  coins: number;
  energy: EnergyState;
  dailyCheckIn: DailyCheckInState;
  inventory: InventoryState;
  settings: AppSettings;
  activityLog: ActivityLogEntry[];
};
