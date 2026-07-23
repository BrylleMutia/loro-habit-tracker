import { createInitialHabits } from "../../constants/habits";
import { equipmentSets } from "../../constants/equipment";
import type { AppState, HabitId } from "../../types/app";
import type { PersistedGameState } from "../../types/backend";
import { createGuildQuestBoard } from "../../utility/guildQuests";

export type AppAction =
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

function getDateKeyInTimeZone(now: string, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date(now));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return now.slice(0, 10);
  }
}

export function createInitialAppState({
  playerId = "loading",
  playerName = "Adventurer",
  now = new Date().toISOString(),
  timeZone = getDeviceTimeZone()
}: InitialAppStateOptions = {}): AppState {
  return {
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
      equippedItemIds: [],
      setCollectionOrder: equipmentSets.map((set) => set.id)
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
      items: [],
      discoveredItemDefinitionIds: [],
      streakShields: 0,
      activeBuffs: []
    },
    guildQuestBoard: createGuildQuestBoard(getDateKeyInTimeZone(now, timeZone)),
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
    case "SET_ACTIVE_HABIT":
      return { ...state, activeHabitId: action.habitId };
    case "HYDRATE_GAME_STATE":
      return { ...action.snapshot, activeHabitId: state.activeHabitId };
    default:
      return state;
  }
}
