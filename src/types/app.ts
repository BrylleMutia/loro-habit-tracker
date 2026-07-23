import { Ionicons } from "@expo/vector-icons";

export type TabId = "home" | "guild" | "stash" | "profile" | "more";
export type EquipmentSlotId =
  | "helmet"
  | "chest"
  | "cape"
  | "gloves"
  | "boots"
  | "weapon"
  | "bag"
  | "buddy";
export type HabitId =
  | "exercise"
  | "reading"
  | "journaling"
  | "water"
  | "sleep"
  | "outdoors";
export type IconName = keyof typeof Ionicons.glyphMap;
export type DateKey = string;
export type AdventureNodeStatus = "done" | "active" | "locked";
export type QuestTrackingType = "timed" | "one-time";
export type AvatarClassId = "druid" | "mercenary" | "ranger" | "warrior" | "wizard";
export type AvatarVariant = "default" | "alternate";
export type EquipmentRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type GuildQuestKind = "side" | "main";
export type GuildQuestMetric =
  | "same-habit-days"
  | "unique-habits"
  | "multi-habit-days"
  | "daily-completions"
  | "timed-and-one-time"
  | "distinct-completion-days"
  | "two-habits-two-days"
  | "chapter-nodes"
  | "chapter-reward-claimed"
  | "habit-completions-each"
  | "max-habit-streak";
export type EquipmentAttributeId =
  | "agility"
  | "defense"
  | "intelligence"
  | "luck"
  | "strength"
  | "vitality";
export type EquipmentStats = Partial<Record<EquipmentAttributeId, number>>;

export type TabItem = {
  id: TabId;
  label: string;
  icon: IconName;
};

export type AdventureReward = {
  coins: number;
  xp: number;
};

export type GuildQuestReward = AdventureReward & {
  itemRarityFloor: EquipmentRarity;
};

export type GuildQuestRewardPreview = {
  itemDefinitionId: string;
  rarity: EquipmentRarity;
};

export type GuildQuestDefinition = {
  id: string;
  kind: GuildQuestKind;
  title: string;
  description: string;
  icon: IconName;
  metric: GuildQuestMetric;
  target: number;
  secondaryTarget?: number;
  reward: GuildQuestReward;
};

export type GuildQuestPeriodState = {
  periodKey: DateKey;
  candidateIds: string[];
  lockedIds: string[];
  claimedIds: string[];
  rewardPreviews?: Record<string, GuildQuestRewardPreview>;
};

export type GuildQuestBoardState = {
  side: GuildQuestPeriodState;
  main: GuildQuestPeriodState;
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
  lootItemId: string | null;
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
  setCollectionOrder: string[];
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

export type InventoryItem = {
  id: string;
  itemDefinitionId: string;
  name: string;
  setId: string;
  setName: string;
  slotId: EquipmentSlotId;
  rarity: EquipmentRarity;
  stats: EquipmentStats;
  acquiredAt: string;
  sourceHabitId: HabitId | null;
  sourceNodeId: string | null;
  sourceDateKey: DateKey;
  sourceGuildQuestId?: string | null;
  sourceGuildPeriodKey?: DateKey | null;
};

export type InventoryStack = {
  key: string;
  items: InventoryItem[];
  representative: InventoryItem;
  quantity: number;
  firstAcquiredAt: string;
  itemValue: number;
  totalValue: number;
  isEquipped: boolean;
  equippedItemId: string | null;
};

export type InventoryState = {
  items: InventoryItem[];
  discoveredItemDefinitionIds: string[];
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
  guildQuestBoard: GuildQuestBoardState;
  settings: AppSettings;
  activityLog: ActivityLogEntry[];
};
