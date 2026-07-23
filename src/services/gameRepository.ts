import { Ionicons } from "@expo/vector-icons";

import type {
  AppSettings,
  GuildQuestKind,
  GuildQuestRewardPreview,
  HabitId,
  InventoryItem,
  PlayerProfile
} from "../types/app";
import type {
  CheckInOutcome,
  EquipmentUpdatedOutcome,
  GameErrorCode,
  GameOutcome,
  GameResponse,
  GuildQuestAcceptanceOutcome,
  GuildQuestRewardOutcome,
  PersistedGameState,
  ProfileUpdatedOutcome,
  QuestCompletionOutcome,
  QuestStartOutcome,
  RewardClaimOutcome,
  SettingsUpdatedOutcome,
  SnapshotOutcome
} from "../types/backend";
import { GameRepositoryError } from "../types/backend";
import type { Json } from "../types/database.generated";
import { normalizeEquipmentSetOrder } from "../utility/equipmentCollections";
import { createGuildQuestBoard } from "../utility/guildQuests";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const habitIds: HabitId[] = [
  "exercise",
  "reading",
  "journaling",
  "water",
  "sleep",
  "outdoors"
];
const equipmentSlotIds = ["helmet", "chest", "cape", "gloves", "boots", "weapon", "bag", "buddy"];
const equipmentRarities = ["common", "uncommon", "rare", "epic", "legendary"];
const equipmentAttributeIds = [
  "agility",
  "defense",
  "intelligence",
  "luck",
  "strength",
  "vitality"
];

const domainErrorMessages: Partial<Record<GameErrorCode, string>> = {
  CHAPTER_INCOMPLETE: "Complete every quest in this chapter before claiming its reward.",
  INVALID_EQUIPMENT_SLOT: "That equipment slot is not available.",
  INSUFFICIENT_ENERGY: "You need more energy for that quest.",
  INVALID_AVATAR_CLASS: "That adventurer class is not available.",
  INVALID_AVATAR_VARIANT: "That avatar style is not available.",
  INVALID_CHAPTER: "That chapter is no longer available.",
  INVALID_DISPLAY_NAME: "Choose a display name between 1 and 40 characters.",
  INVALID_HABIT: "That habit is no longer available.",
  INVALID_SET_ORDER: "That set order is no longer available.",
  GUILD_QUEST_ALREADY_CLAIMED: "That Guild Quest reward has already been claimed.",
  GUILD_QUEST_INVALID_SELECTION: "That Guild Quest cannot be accepted right now.",
  GUILD_QUEST_NOT_READY: "Complete this Guild Quest before claiming its reward.",
  INVALID_TIME_ZONE: "Your current time zone is not supported.",
  ITEM_NOT_OWNED: "That item is not in your inventory.",
  PATH_COMPLETE: "This adventure path is already complete.",
  PROFILE_NOT_FOUND: "Your player profile could not be loaded.",
  QUEST_ALREADY_COMPLETED: "Today’s quest is already complete.",
  QUEST_NOT_TIMED: "This quest does not use a timer.",
  SETTINGS_NOT_FOUND: "Your settings could not be loaded.",
  TIMER_NOT_FINISHED: "Keep going until the quest timer reaches its target.",
  TIMER_NOT_STARTED: "Start the quest timer before completing it.",
  UNAUTHENTICATED: "Sign in again to continue."
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isHabitId(value: unknown): value is HabitId {
  return isString(value) && habitIds.includes(value as HabitId);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isIconName(value: unknown) {
  return isString(value) && value in Ionicons.glyphMap;
}

function isReward(value: unknown) {
  return (
    isRecord(value) &&
    isFiniteNumber(value.coins) &&
    value.coins >= 0 &&
    isFiniteNumber(value.xp) &&
    value.xp >= 0
  );
}

function isInventoryItem(value: unknown): value is InventoryItem {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.itemDefinitionId) ||
    !isString(value.name) ||
    !isString(value.setId) ||
    !isString(value.setName) ||
    !isString(value.slotId) ||
    !equipmentSlotIds.includes(value.slotId) ||
    !isString(value.rarity) ||
    !equipmentRarities.includes(value.rarity) ||
    !isRecord(value.stats) ||
    !isString(value.acquiredAt) ||
    !(value.sourceHabitId === null || isHabitId(value.sourceHabitId)) ||
    !(value.sourceNodeId === null || isString(value.sourceNodeId)) ||
    !isString(value.sourceDateKey)
  ) {
    return false;
  }

  return Object.entries(value.stats).every(
    ([attributeId, amount]) =>
      equipmentAttributeIds.includes(attributeId) &&
      isFiniteNumber(amount) &&
      amount > 0
  );
}

function isGuildQuestBoard(value: unknown) {
  if (!isRecord(value) || !isRecord(value.side) || !isRecord(value.main)) return false;
  return [value.side, value.main].every(
    (period) =>
      isRecord(period) &&
      isString(period.periodKey) &&
      Array.isArray(period.candidateIds) &&
      period.candidateIds.every(isString) &&
      Array.isArray(period.lockedIds) &&
      period.lockedIds.every(isString) &&
      Array.isArray(period.claimedIds) &&
      period.claimedIds.every(isString) &&
      (period.rewardPreviews === undefined ||
        (isRecord(period.rewardPreviews) &&
          Object.values(period.rewardPreviews).every(
            (preview) =>
              isRecord(preview) &&
              isString(preview.itemDefinitionId) &&
              isString(preview.rarity) &&
              equipmentRarities.includes(preview.rarity)
          )))
  );
}

function isQuestNode(value: unknown) {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isFiniteNumber(value.day) ||
    !isString(value.title) ||
    !isString(value.summary) ||
    !isIconName(value.icon) ||
    !isFiniteNumber(value.energyCost) ||
    !isReward(value.reward)
  ) {
    return false;
  }

  return value.questType === "timed"
    ? isFiniteNumber(value.targetDurationSeconds) && value.targetDurationSeconds > 0
    : value.questType === "one-time" &&
        isFiniteNumber(value.targetQuantity) &&
        value.targetQuantity > 0 &&
        isString(value.targetUnit);
}

function isHabit(value: unknown, expectedId: HabitId) {
  if (
    !isRecord(value) ||
    value.id !== expectedId ||
    !isString(value.label) ||
    !isIconName(value.icon) ||
    !isString(value.dailyPrompt) ||
    !isFiniteNumber(value.level) ||
    !isFiniteNumber(value.xp) ||
    !isFiniteNumber(value.streak) ||
    !isNullableString(value.lastCompletedDateKey) ||
    !Array.isArray(value.sections) ||
    !Array.isArray(value.completions) ||
    !Array.isArray(value.claimedChapterRewardIds)
  ) {
    return false;
  }

  const sectionsAreValid = value.sections.every(
    (section) =>
      isRecord(section) &&
      isString(section.id) &&
      isString(section.title) &&
      isString(section.description) &&
      isFiniteNumber(section.order) &&
      isReward(section.reward) &&
      Array.isArray(section.nodes) &&
      section.nodes.every(isQuestNode)
  );
  const completionsAreValid = value.completions.every(
    (completion) =>
      isRecord(completion) &&
      isString(completion.sectionId) &&
      isString(completion.nodeId) &&
      isString(completion.completedOn) &&
      isString(completion.completedAt) &&
      (completion.lootItemId === undefined || isNullableString(completion.lootItemId)) &&
      isReward(completion.reward)
  );
  const timerIsValid =
    value.activeTimedQuest === null ||
    (isRecord(value.activeTimedQuest) &&
      isString(value.activeTimedQuest.sectionId) &&
      isString(value.activeTimedQuest.nodeId) &&
      isString(value.activeTimedQuest.startedOn) &&
      isString(value.activeTimedQuest.startedAt));

  return (
    sectionsAreValid &&
    completionsAreValid &&
    timerIsValid &&
    value.claimedChapterRewardIds.every(isString)
  );
}

function isPersistedGameState(value: unknown): value is PersistedGameState {
  if (!isRecord(value) || !isRecord(value.profile) || !isRecord(value.habits)) {
    return false;
  }

  const profile = value.profile;
  const habits = value.habits;
  const baseStateIsValid =
    isString(profile.id) &&
    isString(profile.name) &&
    isString(profile.joinedAt) &&
    isString(profile.avatarClassId) &&
    ["druid", "mercenary", "ranger", "warrior", "wizard"].includes(profile.avatarClassId) &&
    isString(profile.avatarVariant) &&
    ["default", "alternate"].includes(profile.avatarVariant) &&
    isFiniteNumber(profile.level) &&
    profile.level >= 1 &&
    isFiniteNumber(profile.xp) &&
    profile.xp >= 0 &&
    isFiniteNumber(profile.xpToNextLevel) &&
    profile.xpToNextLevel > 0 &&
    Array.isArray(profile.equippedItemIds) &&
    profile.equippedItemIds.every(isString) &&
    (profile.setCollectionOrder === undefined ||
      (Array.isArray(profile.setCollectionOrder) && profile.setCollectionOrder.every(isString))) &&
    habitIds.every((habitId) => isHabit(habits[habitId], habitId)) &&
    isFiniteNumber(value.dailyStreak) &&
    value.dailyStreak >= 0 &&
    isFiniteNumber(value.longestStreak) &&
    value.longestStreak >= 0 &&
    isNullableString(value.lastStreakDateKey) &&
    isFiniteNumber(value.coins) &&
    value.coins >= 0 &&
    isRecord(value.energy) &&
    isFiniteNumber(value.energy.current) &&
    value.energy.current >= 0 &&
    isFiniteNumber(value.energy.max) &&
    value.energy.max > 0 &&
    value.energy.current <= value.energy.max &&
    isNullableString(value.energy.lastRefillAt) &&
    isRecord(value.dailyCheckIn) &&
    isNullableString(value.dailyCheckIn.lastClaimedDateKey) &&
    isNullableString(value.dailyCheckIn.lastClaimedAt) &&
    isFiniteNumber(value.dailyCheckIn.rewardCoins) &&
    value.dailyCheckIn.rewardCoins >= 0 &&
    isFiniteNumber(value.dailyCheckIn.rewardEnergy) &&
    value.dailyCheckIn.rewardEnergy >= 0 &&
    isRecord(value.inventory) &&
    ((Array.isArray(value.inventory.items) && value.inventory.items.every(isInventoryItem)) ||
      (value.inventory.items === undefined &&
        Array.isArray(value.inventory.ownedItemIds) &&
        value.inventory.ownedItemIds.every(isString))) &&
    (value.inventory.discoveredItemDefinitionIds === undefined ||
      (Array.isArray(value.inventory.discoveredItemDefinitionIds) &&
        value.inventory.discoveredItemDefinitionIds.every(isString))) &&
    isFiniteNumber(value.inventory.streakShields) &&
    value.inventory.streakShields >= 0 &&
    Array.isArray(value.inventory.activeBuffs) &&
    value.inventory.activeBuffs.every(
      (buff) =>
        isRecord(buff) &&
        isString(buff.id) &&
        isString(buff.label) &&
        isString(buff.expiresAt)
    ) &&
    isRecord(value.settings) &&
    isBoolean(value.settings.dailyReminderEnabled) &&
    isString(value.settings.dailyReminderTime) &&
    isBoolean(value.settings.soundEnabled) &&
    isBoolean(value.settings.hapticsEnabled) &&
    isString(value.settings.timeZone) &&
    Array.isArray(value.activityLog) &&
    value.activityLog.every(
      (activity) =>
        isRecord(activity) &&
        isString(activity.id) &&
        ["daily-quest", "chapter-reward", "daily-check-in"].includes(
          isString(activity.type) ? activity.type : ""
        ) &&
        (activity.habitId === null || isHabitId(activity.habitId)) &&
        isNullableString(activity.sectionId) &&
        isNullableString(activity.nodeId) &&
        isString(activity.occurredAt) &&
        isFiniteNumber(activity.coinsEarned) &&
        activity.coinsEarned >= 0 &&
        isFiniteNumber(activity.xpEarned) &&
        activity.xpEarned >= 0
    ) &&
    (value.guildQuestBoard === undefined || isGuildQuestBoard(value.guildQuestBoard));

  return baseStateIsValid;
}

function parseOutcome(value: unknown): GameOutcome {
  if (!isRecord(value) || !isString(value.kind)) {
    throw new GameRepositoryError("The server returned an invalid action result.", "INVALID_RESPONSE");
  }

  switch (value.kind) {
    case "snapshot":
    case "settings-updated":
    case "profile-updated":
      return { kind: value.kind };
    case "equipment-updated":
      if (
        (value.itemId === null || isString(value.itemId)) &&
        isString(value.slotId) &&
        equipmentSlotIds.includes(value.slotId)
      ) {
        return {
          kind: value.kind,
          itemId: value.itemId,
          slotId: value.slotId as InventoryItem["slotId"]
        };
      }
      break;
    case "quest-started":
      if (
        isHabitId(value.habitId) &&
        isString(value.nodeId) &&
        isString(value.startedAt) &&
        isBoolean(value.alreadyStarted)
      ) {
        return {
          kind: value.kind,
          habitId: value.habitId,
          nodeId: value.nodeId,
          startedAt: value.startedAt,
          alreadyStarted: value.alreadyStarted
        };
      }
      break;
    case "quest-completed":
      if (
        isHabitId(value.habitId) &&
        isString(value.nodeId) &&
        isString(value.sectionId) &&
        isFiniteNumber(value.coinReward) &&
        value.coinReward >= 0 &&
        isFiniteNumber(value.xpReward) &&
        value.xpReward >= 0 &&
        isFiniteNumber(value.streak) &&
        value.streak >= 0 &&
        (value.lootItem === undefined || value.lootItem === null || isInventoryItem(value.lootItem)) &&
        isBoolean(value.alreadyCompleted)
      ) {
        return {
          kind: value.kind,
          habitId: value.habitId,
          nodeId: value.nodeId,
          sectionId: value.sectionId,
          coinReward: value.coinReward,
          xpReward: value.xpReward,
          streak: value.streak,
          lootItem: isInventoryItem(value.lootItem) ? value.lootItem : null,
          alreadyCompleted: value.alreadyCompleted
        };
      }
      break;
    case "chapter-reward-claimed":
      if (
        isHabitId(value.habitId) &&
        isString(value.sectionId) &&
        isFiniteNumber(value.coinReward) &&
        value.coinReward >= 0 &&
        isFiniteNumber(value.xpReward) &&
        value.xpReward >= 0 &&
        isBoolean(value.alreadyClaimed)
      ) {
        return {
          kind: value.kind,
          habitId: value.habitId,
          sectionId: value.sectionId,
          coinReward: value.coinReward,
          xpReward: value.xpReward,
          alreadyClaimed: value.alreadyClaimed
        };
      }
      break;
    case "daily-check-in-claimed":
      if (
        isFiniteNumber(value.coinReward) &&
        value.coinReward >= 0 &&
        isFiniteNumber(value.energyReward) &&
        value.energyReward >= 0 &&
        isBoolean(value.alreadyClaimed)
      ) {
        return {
          kind: value.kind,
          coinReward: value.coinReward,
          energyReward: value.energyReward,
          alreadyClaimed: value.alreadyClaimed
        };
      }
      break;
    case "guild-quest-accepted":
      if (
        (value.questKind === "side" || value.questKind === "main") &&
        isString(value.questId)
      ) {
        return {
          kind: value.kind,
          questKind: value.questKind,
          questId: value.questId
        } as GuildQuestAcceptanceOutcome;
      }
      break;
    case "guild-quest-reward-claimed":
      if (
        (value.questKind === "side" || value.questKind === "main") &&
        isString(value.questId) &&
        isFiniteNumber(value.coinReward) &&
        value.coinReward >= 0 &&
        isFiniteNumber(value.xpReward) &&
        value.xpReward >= 0 &&
        (value.lootItem === undefined || value.lootItem === null || isInventoryItem(value.lootItem)) &&
        isBoolean(value.alreadyClaimed)
      ) {
        return {
          kind: value.kind,
          questKind: value.questKind,
          questId: value.questId,
          coinReward: value.coinReward,
          xpReward: value.xpReward,
          lootItem: isInventoryItem(value.lootItem) ? value.lootItem : null,
          alreadyClaimed: value.alreadyClaimed
        } as GuildQuestRewardOutcome;
      }
      break;
  }

  throw new GameRepositoryError("The server returned an invalid action result.", "INVALID_RESPONSE");
}

export function parseGameResponse(value: unknown): GameResponse {
  if (
    !isRecord(value) ||
    !isPersistedGameState(value.snapshot) ||
    !isString(value.serverNow) ||
    !isString(value.localDateKey)
  ) {
    throw new GameRepositoryError("The server returned an invalid game snapshot.", "INVALID_RESPONSE");
  }

  const parsedSnapshot = value.snapshot as PersistedGameState;
  const parsedProfile = parsedSnapshot.profile as PersistedGameState["profile"] & {
    setCollectionOrder?: string[];
  };
  const parsedInventory = parsedSnapshot.inventory as PersistedGameState["inventory"] & {
    items?: InventoryItem[];
    discoveredItemDefinitionIds?: string[];
  };
  const parsedItems = parsedInventory.items ?? [];
  const discoveredItemDefinitionIds = Array.from(
    new Set(
      parsedInventory.discoveredItemDefinitionIds ??
        parsedItems.map((item) => item.itemDefinitionId)
    )
  );
  const snapshot: PersistedGameState = {
    ...parsedSnapshot,
    profile: {
      ...parsedProfile,
      setCollectionOrder: normalizeEquipmentSetOrder(parsedProfile.setCollectionOrder)
    },
    inventory: {
      ...parsedInventory,
      items: parsedItems,
      discoveredItemDefinitionIds
    },
    habits: Object.fromEntries(
      habitIds.map((habitId) => [
        habitId,
        {
          ...parsedSnapshot.habits[habitId],
          completions: parsedSnapshot.habits[habitId].completions.map((completion) => ({
            ...completion,
            lootItemId:
              completion.lootItemId ??
              parsedItems.find(
                (item) =>
                  item.sourceHabitId === habitId && item.sourceNodeId === completion.nodeId
              )?.id ??
              null
          }))
        }
      ])
    ) as PersistedGameState["habits"],
    guildQuestBoard: isGuildQuestBoard(parsedSnapshot.guildQuestBoard)
      ? parsedSnapshot.guildQuestBoard
      : createGuildQuestBoard(value.localDateKey)
  };
  const parsedOutcome = parseOutcome(value.outcome);
  const outcome =
    parsedOutcome.kind === "quest-completed" && !parsedOutcome.lootItem
      ? {
          ...parsedOutcome,
          lootItem:
            snapshot.inventory.items.find(
              (item) =>
                item.sourceHabitId === parsedOutcome.habitId &&
                item.sourceNodeId === parsedOutcome.nodeId
            ) ?? null
        }
      : parsedOutcome.kind === "guild-quest-reward-claimed" && !parsedOutcome.lootItem
        ? {
            ...parsedOutcome,
            lootItem:
              snapshot.inventory.items.find(
                (item) =>
                  item.sourceGuildQuestId === parsedOutcome.questId &&
                  item.sourceGuildPeriodKey ===
                    snapshot.guildQuestBoard[parsedOutcome.questKind].periodKey
              ) ?? null
          }
        : parsedOutcome;

  return {
    snapshot,
    outcome,
    serverNow: value.serverNow,
    localDateKey: value.localDateKey
  };
}

function isKnownErrorCode(value: string): value is GameErrorCode {
  return value in domainErrorMessages ||
    ["CONFIGURATION_ERROR", "INVALID_RESPONSE", "NETWORK_ERROR", "OFFLINE", "UNKNOWN"].includes(
      value
    );
}

function toRepositoryError(error: unknown) {
  if (error instanceof GameRepositoryError) {
    return error;
  }

  const candidate = isRecord(error) ? error : null;
  const details = candidate && isString(candidate.details) ? candidate.details : "";
  const message = candidate && isString(candidate.message) ? candidate.message : "";
  const code = isKnownErrorCode(details) ? details : "UNKNOWN";

  if (/fetch|network|connection|offline/i.test(message)) {
    return new GameRepositoryError(
      "Lory could not reach the trail server. Check your connection and try again.",
      "NETWORK_ERROR",
      error
    );
  }

  return new GameRepositoryError(
    (domainErrorMessages[code] ?? message) || "Something interrupted the trail. Please try again.",
    code,
    error
  );
}

function requireConfiguredClient() {
  if (!isSupabaseConfigured) {
    throw new GameRepositoryError(
      "Add the Supabase URL and publishable key to .env, then restart Expo.",
      "CONFIGURATION_ERROR"
    );
  }
}

async function unwrapRpcResult<TOutcome extends GameOutcome>(
  request: PromiseLike<{ data: Json | null; error: unknown }>,
  expectedKind: TOutcome["kind"]
) {
  requireConfiguredClient();

  try {
    const { data, error } = await request;
    if (error) throw error;

    const response = parseGameResponse(data);
    if (response.outcome.kind !== expectedKind) {
      throw new GameRepositoryError("The server returned the wrong action result.", "INVALID_RESPONSE");
    }

    return response as GameResponse<TOutcome>;
  } catch (error) {
    throw toRepositoryError(error);
  }
}

export function getGameSnapshot() {
  return unwrapRpcResult<SnapshotOutcome>(supabase.rpc("get_game_snapshot"), "snapshot");
}

export function startDailyQuest(habitId: HabitId) {
  return unwrapRpcResult<QuestStartOutcome>(
    supabase.rpc("start_daily_quest", { p_habit_id: habitId }),
    "quest-started"
  );
}

export function completeDailyQuest(habitId: HabitId) {
  return unwrapRpcResult<QuestCompletionOutcome>(
    supabase.rpc("complete_daily_quest", { p_habit_id: habitId }),
    "quest-completed"
  );
}

export function claimChapterReward(habitId: HabitId, sectionId: string) {
  return unwrapRpcResult<RewardClaimOutcome>(
    supabase.rpc("claim_chapter_reward", {
      p_chapter_id: sectionId,
      p_habit_id: habitId
    }),
    "chapter-reward-claimed"
  );
}

export function claimDailyCheckIn() {
  return unwrapRpcResult<CheckInOutcome>(
    supabase.rpc("claim_daily_check_in"),
    "daily-check-in-claimed"
  );
}

export function acceptGuildQuest(
  questKind: GuildQuestKind,
  questId: string,
  rewardPreview: GuildQuestRewardPreview
) {
  return unwrapRpcResult<GuildQuestAcceptanceOutcome>(
    supabase.rpc("accept_guild_quest", {
      p_quest_kind: questKind,
      p_quest_id: questId,
      p_reward_preview: rewardPreview as unknown as Json
    }),
    "guild-quest-accepted"
  );
}

export function claimGuildQuestReward(questKind: GuildQuestKind, questId: string) {
  return unwrapRpcResult<GuildQuestRewardOutcome>(
    supabase.rpc("claim_guild_quest_reward", {
      p_quest_kind: questKind,
      p_quest_id: questId
    }),
    "guild-quest-reward-claimed"
  );
}

export function updateSettings(settings: Partial<AppSettings>) {
  return unwrapRpcResult<SettingsUpdatedOutcome>(
    supabase.rpc("update_settings", { p_settings: settings as unknown as Json }),
    "settings-updated"
  );
}

export function updateProfile(
  profileFields: Partial<
    Pick<PlayerProfile, "avatarClassId" | "avatarVariant" | "name" | "setCollectionOrder">
  >
) {
  return unwrapRpcResult<ProfileUpdatedOutcome>(
    supabase.rpc("update_profile", { p_profile_fields: profileFields as unknown as Json }),
    "profile-updated"
  );
}

export function equipItem(itemId: string) {
  return unwrapRpcResult<EquipmentUpdatedOutcome>(
    supabase.rpc("equip_inventory_item", { p_item_id: itemId }),
    "equipment-updated"
  );
}
