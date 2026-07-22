import type {
  AppSettings,
  AppState,
  DateKey,
  HabitId,
  HabitState,
  PlayerProfile
} from "../types/app";
import type {
  CheckInOutcome,
  EquipmentUpdatedOutcome,
  GameOutcome,
  GameResponse,
  PersistedGameState,
  ProfileUpdatedOutcome,
  QuestCompletionOutcome,
  QuestStartOutcome,
  RewardClaimOutcome,
  SettingsUpdatedOutcome,
  SnapshotOutcome
} from "../types/backend";
import { GameRepositoryError } from "../types/backend";
import { loadoutSlots } from "../constants/profile";
import { normalizeEquipmentSetOrder } from "../utility/equipmentCollections";
import {
  createNodeCompletion,
  getActiveNodeLocation,
  getApplicableTimedQuestProgress,
  getNextStreak,
  isSectionComplete
} from "../utility/adventurePath";
import { rollEquipmentLoot } from "../utility/equipmentLoot";

type EditableProfileFields = Partial<
  Pick<PlayerProfile, "avatarClassId" | "avatarVariant" | "name" | "setCollectionOrder">
>;

function toSnapshot(state: AppState): PersistedGameState {
  const { activeHabitId: _activeHabitId, activeTab: _activeTab, ...snapshot } = state;
  return snapshot;
}

function response<TOutcome extends GameOutcome>(
  state: AppState,
  outcome: TOutcome,
  localDateKey: DateKey,
  serverNow: string
): GameResponse<TOutcome> {
  return { snapshot: toSnapshot(state), outcome, localDateKey, serverNow };
}

function addProfileXp(profile: PlayerProfile, earnedXp: number): PlayerProfile {
  let level = profile.level;
  let xp = profile.xp + earnedXp;
  let xpToNextLevel = profile.xpToNextLevel;

  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level += 1;
    xpToNextLevel = Math.round(xpToNextLevel * 1.25);
  }

  return { ...profile, level, xp, xpToNextLevel };
}

function addHabitXp(habit: HabitState, earnedXp: number): HabitState {
  let level = habit.level;
  let xp = habit.xp + earnedXp;
  let xpToNextLevel = level * 100;

  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level += 1;
    xpToNextLevel = level * 100;
  }

  return { ...habit, level, xp };
}

function requireHabit(state: AppState, habitId: HabitId) {
  const habit = state.habits[habitId];
  if (!habit) throw new GameRepositoryError("That habit is not available.", "INVALID_HABIT");
  return habit;
}

export function getLocalGameSnapshot(
  state: AppState,
  localDateKey: DateKey,
  now = new Date().toISOString()
) {
  return response<SnapshotOutcome>(state, { kind: "snapshot" }, localDateKey, now);
}

export function startLocalDailyQuest(
  state: AppState,
  habitId: HabitId,
  localDateKey: DateKey,
  now = new Date().toISOString()
) {
  const habit = requireHabit(state, habitId);
  if (habit.lastCompletedDateKey === localDateKey) {
    throw new GameRepositoryError("Today's quest is already complete.", "QUEST_ALREADY_COMPLETED");
  }

  const location = getActiveNodeLocation(habit);
  if (!location) throw new GameRepositoryError("This adventure path is complete.", "PATH_COMPLETE");
  if (location.node.questType !== "timed") {
    throw new GameRepositoryError("This quest does not use a timer.", "QUEST_NOT_TIMED");
  }

  const existing = getApplicableTimedQuestProgress(habit, location.node.id, localDateKey);
  if (existing) {
    return response<QuestStartOutcome>(
      state,
      {
        kind: "quest-started",
        habitId,
        nodeId: location.node.id,
        startedAt: existing.startedAt,
        alreadyStarted: true
      },
      localDateKey,
      now
    );
  }

  if (state.energy.current < location.node.energyCost) {
    throw new GameRepositoryError("You need more energy for that quest.", "INSUFFICIENT_ENERGY");
  }

  const nextState: AppState = {
    ...state,
    energy: { ...state.energy, current: state.energy.current - location.node.energyCost },
    habits: {
      ...state.habits,
      [habitId]: {
        ...habit,
        activeTimedQuest: {
          sectionId: location.section.id,
          nodeId: location.node.id,
          startedOn: localDateKey,
          startedAt: now
        }
      }
    }
  };

  return response<QuestStartOutcome>(
    nextState,
    {
      kind: "quest-started",
      habitId,
      nodeId: location.node.id,
      startedAt: now,
      alreadyStarted: false
    },
    localDateKey,
    now
  );
}

export function completeLocalDailyQuest(
  state: AppState,
  habitId: HabitId,
  localDateKey: DateKey,
  now = new Date().toISOString()
) {
  const habit = requireHabit(state, habitId);
  const existing = habit.completions.find((completion) => completion.completedOn === localDateKey);
  if (existing) {
    const lootItem = state.inventory.items.find((item) => item.id === existing.lootItemId) ?? null;
    return response<QuestCompletionOutcome>(
      state,
      {
        kind: "quest-completed",
        habitId,
        nodeId: existing.nodeId,
        sectionId: existing.sectionId,
        coinReward: existing.reward.coins,
        xpReward: existing.reward.xp,
        streak: habit.streak,
        lootItem,
        alreadyCompleted: true
      },
      localDateKey,
      now
    );
  }

  const location = getActiveNodeLocation(habit);
  if (!location) throw new GameRepositoryError("This adventure path is complete.", "PATH_COMPLETE");
  const { node, section } = location;

  if (node.questType === "timed") {
    const timer = getApplicableTimedQuestProgress(habit, node.id, localDateKey);
    if (!timer) {
      throw new GameRepositoryError("Start the quest timer before completing it.", "TIMER_NOT_STARTED");
    }
    if (Date.parse(now) - Date.parse(timer.startedAt) < node.targetDurationSeconds * 1000) {
      throw new GameRepositoryError(
        "Keep going until the quest timer reaches its target.",
        "TIMER_NOT_FINISHED"
      );
    }
  } else if (state.energy.current < node.energyCost) {
    throw new GameRepositoryError("You need more energy for that quest.", "INSUFFICIENT_ENERGY");
  }

  const habitStreak = getNextStreak(habit.streak, habit.lastCompletedDateKey, localDateKey);
  const dailyStreak = getNextStreak(state.dailyStreak, state.lastStreakDateKey, localDateKey);
  const lootItem = rollEquipmentLoot({
    habitId,
    nodeId: node.id,
    dateKey: localDateKey,
    now
  });
  const completedHabit = addHabitXp(
    {
      ...habit,
      streak: habitStreak,
      lastCompletedDateKey: localDateKey,
      activeTimedQuest: null,
      completions: [
        ...habit.completions,
        createNodeCompletion(section.id, node.id, localDateKey, now, node.reward, lootItem.id)
      ]
    },
    node.reward.xp
  );
  const completionEnergyCost = node.questType === "one-time" ? node.energyCost : 0;
  const nextState: AppState = {
    ...state,
    coins: state.coins + node.reward.coins,
    energy: { ...state.energy, current: state.energy.current - completionEnergyCost },
    profile: addProfileXp(state.profile, node.reward.xp),
    dailyStreak,
    longestStreak: Math.max(state.longestStreak, dailyStreak),
    lastStreakDateKey: localDateKey,
    habits: { ...state.habits, [habitId]: completedHabit },
    inventory: {
      ...state.inventory,
      items: [...state.inventory.items, lootItem],
      discoveredItemDefinitionIds: Array.from(
        new Set([
          ...(state.inventory.discoveredItemDefinitionIds ?? []),
          lootItem.itemDefinitionId
        ])
      )
    },
    activityLog: [
      {
        id: `daily-quest-${node.id}-${now}`,
        type: "daily-quest",
        habitId,
        sectionId: section.id,
        nodeId: node.id,
        occurredAt: now,
        coinsEarned: node.reward.coins,
        xpEarned: node.reward.xp
      },
      ...state.activityLog
    ]
  };

  return response<QuestCompletionOutcome>(
    nextState,
    {
      kind: "quest-completed",
      habitId,
      nodeId: node.id,
      sectionId: section.id,
      coinReward: node.reward.coins,
      xpReward: node.reward.xp,
      streak: habitStreak,
      lootItem,
      alreadyCompleted: false
    },
    localDateKey,
    now
  );
}

export function claimLocalChapterReward(
  state: AppState,
  habitId: HabitId,
  sectionId: string,
  localDateKey: DateKey,
  now = new Date().toISOString()
) {
  const habit = requireHabit(state, habitId);
  const section = habit.sections.find((candidate) => candidate.id === sectionId);
  if (!section) throw new GameRepositoryError("That chapter is not available.", "INVALID_CHAPTER");

  if (habit.claimedChapterRewardIds.includes(sectionId)) {
    return response<RewardClaimOutcome>(
      state,
      {
        kind: "chapter-reward-claimed",
        habitId,
        sectionId,
        coinReward: section.reward.coins,
        xpReward: section.reward.xp,
        alreadyClaimed: true
      },
      localDateKey,
      now
    );
  }
  if (!isSectionComplete(habit, sectionId)) {
    throw new GameRepositoryError(
      "Complete every quest in this chapter before claiming its reward.",
      "CHAPTER_INCOMPLETE"
    );
  }

  const rewardedHabit = addHabitXp(
    { ...habit, claimedChapterRewardIds: [...habit.claimedChapterRewardIds, sectionId] },
    section.reward.xp
  );
  const nextState: AppState = {
    ...state,
    coins: state.coins + section.reward.coins,
    profile: addProfileXp(state.profile, section.reward.xp),
    habits: { ...state.habits, [habitId]: rewardedHabit },
    activityLog: [
      {
        id: `chapter-${sectionId}-${now}`,
        type: "chapter-reward",
        habitId,
        sectionId,
        nodeId: null,
        occurredAt: now,
        coinsEarned: section.reward.coins,
        xpEarned: section.reward.xp
      },
      ...state.activityLog
    ]
  };

  return response<RewardClaimOutcome>(
    nextState,
    {
      kind: "chapter-reward-claimed",
      habitId,
      sectionId,
      coinReward: section.reward.coins,
      xpReward: section.reward.xp,
      alreadyClaimed: false
    },
    localDateKey,
    now
  );
}

export function claimLocalDailyCheckIn(
  state: AppState,
  localDateKey: DateKey,
  now = new Date().toISOString()
) {
  const { rewardCoins, rewardEnergy } = state.dailyCheckIn;
  if (state.dailyCheckIn.lastClaimedDateKey === localDateKey) {
    return response<CheckInOutcome>(
      state,
      { kind: "daily-check-in-claimed", coinReward: rewardCoins, energyReward: rewardEnergy, alreadyClaimed: true },
      localDateKey,
      now
    );
  }

  const nextState: AppState = {
    ...state,
    coins: state.coins + rewardCoins,
    energy: {
      ...state.energy,
      current: Math.min(state.energy.max, state.energy.current + rewardEnergy),
      lastRefillAt: now
    },
    dailyCheckIn: {
      ...state.dailyCheckIn,
      lastClaimedDateKey: localDateKey,
      lastClaimedAt: now
    },
    activityLog: [
      {
        id: `check-in-${localDateKey}`,
        type: "daily-check-in",
        habitId: null,
        sectionId: null,
        nodeId: null,
        occurredAt: now,
        coinsEarned: rewardCoins,
        xpEarned: 0
      },
      ...state.activityLog
    ]
  };

  return response<CheckInOutcome>(
    nextState,
    { kind: "daily-check-in-claimed", coinReward: rewardCoins, energyReward: rewardEnergy, alreadyClaimed: false },
    localDateKey,
    now
  );
}

export function updateLocalSettings(
  state: AppState,
  settings: Partial<AppSettings>,
  localDateKey: DateKey,
  now = new Date().toISOString()
) {
  const nextState = { ...state, settings: { ...state.settings, ...settings } };
  return response<SettingsUpdatedOutcome>(
    nextState,
    { kind: "settings-updated" },
    localDateKey,
    now
  );
}

export function equipLocalItem(
  state: AppState,
  itemId: string,
  localDateKey: DateKey,
  now = new Date().toISOString()
) {
  const item = state.inventory.items.find((candidate) => candidate.id === itemId);
  if (!item) {
    throw new GameRepositoryError("That item is not in your inventory.", "ITEM_NOT_OWNED");
  }

  const slot = loadoutSlots.find((candidate) => candidate.id === item.slotId);
  if (!slot) {
    throw new GameRepositoryError("That equipment slot is not available.", "INVALID_EQUIPMENT_SLOT");
  }

  const equippedItemIds = Array.from({ length: loadoutSlots.length }, (_, index) =>
    state.profile.equippedItemIds[index] ?? ""
  );
  const nextItemId = equippedItemIds[slot.sortOrder] === item.id ? null : item.id;
  equippedItemIds[slot.sortOrder] = nextItemId ?? "";
  const nextState = {
    ...state,
    profile: { ...state.profile, equippedItemIds }
  };

  return response<EquipmentUpdatedOutcome>(
    nextState,
    { kind: "equipment-updated", itemId: nextItemId, slotId: item.slotId },
    localDateKey,
    now
  );
}

export function updateLocalProfile(
  state: AppState,
  fields: EditableProfileFields,
  localDateKey: DateKey,
  now = new Date().toISOString()
) {
  const name = fields.name?.trim();
  if (fields.name !== undefined && !name) {
    throw new GameRepositoryError("Display name cannot be empty.", "INVALID_DISPLAY_NAME");
  }
  const nextState = {
    ...state,
    profile: {
      ...state.profile,
      ...fields,
      ...(fields.setCollectionOrder
        ? { setCollectionOrder: normalizeEquipmentSetOrder(fields.setCollectionOrder) }
        : {}),
      ...(name ? { name: name.slice(0, 40) } : {})
    }
  };
  return response<ProfileUpdatedOutcome>(
    nextState,
    { kind: "profile-updated" },
    localDateKey,
    now
  );
}
