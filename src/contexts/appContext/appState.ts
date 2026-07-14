import { createInitialHabits } from "../../constants/habits";
import type {
  AppSettings,
  AppState,
  DateKey,
  HabitId,
  HabitState,
  PlayerProfile,
  TabId
} from "../../types/app";
import {
  createNodeCompletion,
  getActiveNodeLocation,
  getApplicableTimedQuestProgress,
  getNextStreak,
  isSectionComplete
} from "../../utility/adventurePath";

export type AppAction =
  | { type: "SET_ACTIVE_TAB"; tabId: TabId }
  | { type: "SET_ACTIVE_HABIT"; habitId: HabitId }
  | {
      type: "START_DAILY_QUEST";
      habitId: HabitId;
      dateKey: DateKey;
      startedAt: string;
    }
  | {
      type: "COMPLETE_DAILY_QUEST";
      habitId: HabitId;
      dateKey: DateKey;
      completedAt: string;
    }
  | {
      type: "CLAIM_CHAPTER_REWARD";
      habitId: HabitId;
      sectionId: string;
      claimedAt: string;
    }
  | { type: "ADD_COINS"; amount: number }
  | { type: "SPEND_COINS"; amount: number }
  | { type: "CONSUME_ENERGY"; amount: number }
  | { type: "RESTORE_ENERGY"; amount: number; restoredAt: string }
  | { type: "CLAIM_DAILY_CHECK_IN"; dateKey: DateKey; claimedAt: string }
  | { type: "UPDATE_SETTINGS"; settings: Partial<AppSettings> };

export type InitialAppStateOptions = {
  playerId?: string;
  playerName?: string;
  now?: string;
};

export function createInitialAppState({
  playerId = "guest",
  playerName = "Adventurer",
  now = new Date().toISOString()
}: InitialAppStateOptions = {}): AppState {
  return {
    activeTab: "home",
    activeHabitId: "exercise",
    profile: {
      id: playerId,
      name: playerName,
      joinedAt: now,
      avatarClassId: "warrior",
      avatarVariant: "default",
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      equippedItemIds: []
    },
    habits: createInitialHabits(),
    dailyStreak: 0,
    longestStreak: 0,
    lastStreakDateKey: null,
    coins: 0,
    energy: {
      current: 10,
      max: 10,
      lastRefillAt: null
    },
    dailyCheckIn: {
      lastClaimedDateKey: null,
      lastClaimedAt: null,
      rewardCoins: 25,
      rewardEnergy: 2
    },
    inventory: {
      ownedItemIds: [],
      streakShields: 0,
      activeBuffs: []
    },
    settings: {
      dailyReminderEnabled: true,
      dailyReminderTime: "19:00",
      soundEnabled: true,
      hapticsEnabled: true
    },
    activityLog: []
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
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

function hasTimedQuestReachedTarget(
  startedAt: string,
  completedAt: string,
  targetDurationSeconds: number
) {
  const startedAtMilliseconds = Date.parse(startedAt);
  const completedAtMilliseconds = Date.parse(completedAt);

  if (!Number.isFinite(startedAtMilliseconds) || !Number.isFinite(completedAtMilliseconds)) {
    return false;
  }

  return completedAtMilliseconds - startedAtMilliseconds >= targetDurationSeconds * 1000;
}

// Completion stays atomic so energy, rewards, streaks, and path progress cannot diverge.
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.tabId };
    case "SET_ACTIVE_HABIT":
      return { ...state, activeHabitId: action.habitId };
    case "START_DAILY_QUEST": {
      const habit = state.habits[action.habitId];
      const activeLocation = getActiveNodeLocation(habit);

      if (
        !activeLocation ||
        activeLocation.node.questType !== "timed" ||
        habit.lastCompletedDateKey === action.dateKey ||
        getApplicableTimedQuestProgress(habit, activeLocation.node.id, action.dateKey) ||
        !Number.isFinite(Date.parse(action.startedAt)) ||
        activeLocation.node.energyCost > state.energy.current
      ) {
        return state;
      }

      return {
        ...state,
        energy: {
          ...state.energy,
          current: state.energy.current - activeLocation.node.energyCost
        },
        habits: {
          ...state.habits,
          [action.habitId]: {
            ...habit,
            activeTimedQuest: {
              sectionId: activeLocation.section.id,
              nodeId: activeLocation.node.id,
              startedOn: action.dateKey,
              startedAt: action.startedAt
            }
          }
        }
      };
    }
    case "COMPLETE_DAILY_QUEST": {
      const habit = state.habits[action.habitId];
      const activeLocation = getActiveNodeLocation(habit);

      if (!activeLocation || habit.lastCompletedDateKey === action.dateKey) {
        return state;
      }

      const { node } = activeLocation;
      const energyCostAtCompletion = node.questType === "one-time" ? node.energyCost : 0;

      if (node.questType === "timed") {
        const timedQuestProgress = getApplicableTimedQuestProgress(
          habit,
          node.id,
          action.dateKey
        );

        if (
          !timedQuestProgress ||
          !hasTimedQuestReachedTarget(
            timedQuestProgress.startedAt,
            action.completedAt,
            node.targetDurationSeconds
          )
        ) {
          return state;
        }
      } else if (energyCostAtCompletion > state.energy.current) {
        return state;
      }

      const reward = node.reward;
      const habitStreak = getNextStreak(
        habit.streak,
        habit.lastCompletedDateKey,
        action.dateKey
      );
      const appStreak = getNextStreak(
        state.dailyStreak,
        state.lastStreakDateKey,
        action.dateKey
      );
      const completedHabit = addHabitXp(
        {
          ...habit,
          streak: habitStreak,
          lastCompletedDateKey: action.dateKey,
          activeTimedQuest: null,
          completions: [
            ...habit.completions,
            createNodeCompletion(
              activeLocation.section.id,
              node.id,
              action.dateKey,
              action.completedAt,
              reward
            )
          ]
        },
        reward.xp
      );

      return {
        ...state,
        coins: state.coins + reward.coins,
        energy: {
          ...state.energy,
          current: state.energy.current - energyCostAtCompletion
        },
        profile: addProfileXp(state.profile, reward.xp),
        dailyStreak: appStreak,
        longestStreak: Math.max(state.longestStreak, appStreak),
        lastStreakDateKey: action.dateKey,
        habits: { ...state.habits, [action.habitId]: completedHabit },
        activityLog: [
          {
            id: `daily-quest-${node.id}-${action.completedAt}`,
            type: "daily-quest",
            habitId: action.habitId,
            sectionId: activeLocation.section.id,
            nodeId: node.id,
            occurredAt: action.completedAt,
            coinsEarned: reward.coins,
            xpEarned: reward.xp
          },
          ...state.activityLog
        ]
      };
    }
    case "CLAIM_CHAPTER_REWARD": {
      const habit = state.habits[action.habitId];
      const section = habit.sections.find((candidate) => candidate.id === action.sectionId);

      if (
        !section ||
        !isSectionComplete(habit, section.id) ||
        habit.claimedChapterRewardIds.includes(section.id)
      ) {
        return state;
      }

      const rewardedHabit = addHabitXp(
        {
          ...habit,
          claimedChapterRewardIds: [...habit.claimedChapterRewardIds, section.id]
        },
        section.reward.xp
      );

      return {
        ...state,
        coins: state.coins + section.reward.coins,
        profile: addProfileXp(state.profile, section.reward.xp),
        habits: { ...state.habits, [action.habitId]: rewardedHabit },
        activityLog: [
          {
            id: `chapter-${section.id}-${action.claimedAt}`,
            type: "chapter-reward",
            habitId: action.habitId,
            sectionId: section.id,
            nodeId: null,
            occurredAt: action.claimedAt,
            coinsEarned: section.reward.coins,
            xpEarned: section.reward.xp
          },
          ...state.activityLog
        ]
      };
    }
    case "ADD_COINS":
      return { ...state, coins: state.coins + Math.max(0, action.amount) };
    case "SPEND_COINS": {
      const amount = Math.max(0, action.amount);
      return amount > state.coins ? state : { ...state, coins: state.coins - amount };
    }
    case "CONSUME_ENERGY": {
      const amount = Math.max(0, action.amount);

      if (amount > state.energy.current) {
        return state;
      }

      return {
        ...state,
        energy: { ...state.energy, current: state.energy.current - amount }
      };
    }
    case "RESTORE_ENERGY":
      return {
        ...state,
        energy: {
          ...state.energy,
          current: clamp(state.energy.current + Math.max(0, action.amount), 0, state.energy.max),
          lastRefillAt: action.restoredAt
        }
      };
    case "CLAIM_DAILY_CHECK_IN": {
      if (state.dailyCheckIn.lastClaimedDateKey === action.dateKey) {
        return state;
      }

      const rewardCoins = state.dailyCheckIn.rewardCoins;

      return {
        ...state,
        coins: state.coins + rewardCoins,
        energy: {
          ...state.energy,
          current: clamp(
            state.energy.current + state.dailyCheckIn.rewardEnergy,
            0,
            state.energy.max
          ),
          lastRefillAt: action.claimedAt
        },
        dailyCheckIn: {
          ...state.dailyCheckIn,
          lastClaimedDateKey: action.dateKey,
          lastClaimedAt: action.claimedAt
        },
        activityLog: [
          {
            id: `check-in-${action.dateKey}`,
            type: "daily-check-in",
            habitId: null,
            sectionId: null,
            nodeId: null,
            occurredAt: action.claimedAt,
            coinsEarned: rewardCoins,
            xpEarned: 0
          },
          ...state.activityLog
        ]
      };
    }
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    default:
      return state;
  }
}
