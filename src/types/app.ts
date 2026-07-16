import { Ionicons } from "@expo/vector-icons";

export type TabId = "home" | "quests" | "shop" | "profile" | "more";
export type HabitId = "exercise" | "reading" | "water" | "sleep";
export type IconName = keyof typeof Ionicons.glyphMap;
export type DateKey = string;
export type AdventureNodeStatus = "done" | "active" | "locked";
export type QuestTrackingType = "timed" | "one-time";
export type AvatarClassId = "druid" | "mercenary" | "ranger" | "warrior" | "wizard";
export type AvatarVariant = "default" | "alternate";

export type TabItem = {
  id: TabId;
  label: string;
  icon: IconName;
};

export type AdventureReward = {
  coins: number;
  xp: number;
};

type AdventureNodeBase = {
  id: string;
  day: number;
  title: string;
  summary: string;
  icon: IconName;
  energyCost: number;
  reward: AdventureReward;
};

export type TimedAdventureNode = AdventureNodeBase & {
  questType: "timed";
  targetDurationSeconds: number;
};

export type OneTimeAdventureNode = AdventureNodeBase & {
  questType: "one-time";
  targetQuantity: number;
  targetUnit: string;
};

export type AdventureNode = TimedAdventureNode | OneTimeAdventureNode;

export type AdventureSection = {
  id: string;
  title: string;
  description: string;
  order: number;
  reward: AdventureReward;
  nodes: AdventureNode[];
};

export type NodeCompletionRecord = {
  sectionId: string;
  nodeId: string;
  completedOn: DateKey;
  completedAt: string;
  reward: AdventureReward;
};

export type TimedQuestProgress = {
  sectionId: string;
  nodeId: string;
  startedOn: DateKey;
  startedAt: string;
};

export type HabitState = {
  id: HabitId;
  label: string;
  icon: IconName;
  dailyPrompt: string;
  level: number;
  xp: number;
  streak: number;
  lastCompletedDateKey: DateKey | null;
  sections: AdventureSection[];
  completions: NodeCompletionRecord[];
  activeTimedQuest: TimedQuestProgress | null;
  claimedChapterRewardIds: string[];
};

export type PlayerProfile = {
  id: string;
  name: string;
  joinedAt: string;
  avatarClassId: AvatarClassId;
  avatarVariant: AvatarVariant;
  level: number;
  xp: number;
  xpToNextLevel: number;
  equippedItemIds: string[];
};

export type EnergyState = {
  current: number;
  max: number;
  lastRefillAt: string | null;
};

export type DailyCheckInState = {
  lastClaimedDateKey: DateKey | null;
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
  timeZone: string;
};

export type ActivityLogEntry = {
  id: string;
  type: "daily-quest" | "chapter-reward" | "daily-check-in";
  habitId: HabitId | null;
  sectionId: string | null;
  nodeId: string | null;
  occurredAt: string;
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
  lastStreakDateKey: DateKey | null;
  coins: number;
  energy: EnergyState;
  dailyCheckIn: DailyCheckInState;
  inventory: InventoryState;
  settings: AppSettings;
  activityLog: ActivityLogEntry[];
};
