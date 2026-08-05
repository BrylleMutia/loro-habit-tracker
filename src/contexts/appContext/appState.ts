import { createInitialHabits, defaultHabitTargets, habitOrder } from "../../constants/habits";
import { equipmentSets } from "../../constants/equipment";
import type { AppState, HabitId } from "../../types/app";
import type { PersistedGameState } from "../../types/backend";
import { createGuildQuestBoard } from "../../utility/guildQuests";
import { createInitialShopState } from "../../utility/shop";

export type AppAction =
  | { type: "SET_ACTIVE_HABIT"; habitId: HabitId }
  | { type: "SET_ENABLED_HABITS"; activeHabitId: HabitId; enabledHabitIds: HabitId[] }
  | { type: "SET_TARGET_OVERRIDE"; habitId: HabitId; value: number | null }
  | {
      type: "HYDRATE_GAME_STATE";
      snapshot: PersistedGameState;
      normalizeLocalDefaults?: boolean;
    };

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

const localOneTimeDefaults: Partial<
  Record<HabitId, { targetQuantity: number; targetUnit: string }>
> = {
  water: { targetQuantity: defaultHabitTargets.water, targetUnit: "glasses" },
  sleep: { targetQuantity: defaultHabitTargets.sleep, targetUnit: "hours" },
  outdoors: { targetQuantity: defaultHabitTargets.outdoors, targetUnit: "minutes" }
};

function normalizeLocalHabitDefaults(snapshot: PersistedGameState): PersistedGameState {
  const habits = { ...snapshot.habits };

  for (const habitId of Object.keys(localOneTimeDefaults) as HabitId[]) {
    const habit = habits[habitId];
    const defaults = localOneTimeDefaults[habitId];
    if (!habit || !defaults) continue;

    habits[habitId] = {
      ...habit,
      sections: habit.sections.map((section) => ({
        ...section,
        nodes: section.nodes.map((node) =>
          node.questType === "one-time"
            ? { ...node, targetQuantity: defaults.targetQuantity, targetUnit: defaults.targetUnit }
            : node
        )
      }))
    };
  }

  return { ...snapshot, habits };
}

export function createInitialAppState({
  playerId = "loading",
  playerName = "Adventurer",
  now = new Date().toISOString(),
  timeZone = getDeviceTimeZone()
}: InitialAppStateOptions = {}): AppState {
  return {
    activeHabitId: "exercise",
    enabledHabitIds: [...habitOrder],
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
    shop: createInitialShopState(getDateKeyInTimeZone(now, timeZone)),
    guildQuestBoard: createGuildQuestBoard(getDateKeyInTimeZone(now, timeZone)),
    settings: {
      dailyReminderEnabled: true,
      dailyReminderTime: "19:00",
      soundEnabled: true,
      hapticsEnabled: true,
      timeZone
    },
    targetOverrides: {},
    activityLog: []
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ACTIVE_HABIT":
      return { ...state, activeHabitId: action.habitId };
    case "SET_ENABLED_HABITS":
      return {
        ...state,
        activeHabitId: action.activeHabitId,
        enabledHabitIds: [...action.enabledHabitIds]
      };
    case "SET_TARGET_OVERRIDE": {
      const next = { ...state.targetOverrides };
      if (action.value === null) {
        delete next[action.habitId];
      } else {
        next[action.habitId] = action.value;
      }
      return { ...state, targetOverrides: next };
    }
    case "HYDRATE_GAME_STATE": {
      const snapshot = action.normalizeLocalDefaults
        ? normalizeLocalHabitDefaults(action.snapshot)
        : action.snapshot;

      return {
        ...snapshot,
        activeHabitId: snapshot.enabledHabitIds.includes(state.activeHabitId)
          ? state.activeHabitId
          : snapshot.enabledHabitIds[0] ?? state.activeHabitId,
        targetOverrides:
          snapshot.targetOverrides !== undefined
            ? snapshot.targetOverrides
            : state.targetOverrides
      };
    }
    default:
      return state;
  }
}
