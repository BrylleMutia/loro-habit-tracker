import { createInitialHabits } from "../../constants/habits";
import type { AppState, HabitId, TabId } from "../../types/app";
import type { PersistedGameState } from "../../types/backend";

export type AppAction =
  | { type: "SET_ACTIVE_TAB"; tabId: TabId }
  | { type: "SET_ACTIVE_HABIT"; habitId: HabitId }
  | { type: "HYDRATE_GAME_STATE"; snapshot: PersistedGameState };

export type InitialAppStateOptions = {
  playerId?: string;
  playerName?: string;
  now?: string;
  timeZone?: string;
};

function getDeviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function createInitialAppState({
  playerId = "loading",
  playerName = "Adventurer",
  now = new Date().toISOString(),
  timeZone = getDeviceTimeZone()
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
      hapticsEnabled: true,
      timeZone
    },
    activityLog: []
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.tabId };
    case "SET_ACTIVE_HABIT":
      return { ...state, activeHabitId: action.habitId };
    case "HYDRATE_GAME_STATE":
      return {
        ...action.snapshot,
        activeTab: state.activeTab,
        activeHabitId: state.activeHabitId
      };
    default:
      return state;
  }
}
