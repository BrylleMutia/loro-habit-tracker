import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";

import { createInitialHabits } from "../../constants/habits";
import type {
  AppSettings,
  AppState,
  HabitId,
  HabitState,
  TabId
} from "../../types/app";

type AppAction =
  | { type: "SET_ACTIVE_TAB"; tabId: TabId }
  | { type: "SET_ACTIVE_HABIT"; habitId: HabitId }
  | { type: "SET_HABIT_PROGRESS"; habitId: HabitId; current: number }
  | { type: "INCREMENT_HABIT_PROGRESS"; habitId: HabitId; amount: number }
  | { type: "SET_DAILY_STREAK"; streak: number }
  | { type: "ADD_COINS"; amount: number }
  | { type: "SPEND_COINS"; amount: number }
  | { type: "CONSUME_ENERGY"; amount: number }
  | { type: "RESTORE_ENERGY"; amount: number; restoredAt: string }
  | { type: "CLAIM_DAILY_CHECK_IN"; claimedAt: string }
  | {
      type: "COMPLETE_PATH_ITEM";
      habitId: HabitId;
      pathItemId: string;
      completedAt: string;
    }
  | { type: "UPDATE_SETTINGS"; settings: Partial<AppSettings> };

type AppContextValue = AppState & {
  habitList: HabitState[];
  activeHabit: HabitState;
  activeHabitProgressPercent: number;
  setActiveTab: (tabId: TabId) => void;
  setActiveHabit: (habitId: HabitId) => void;
  setHabitProgress: (habitId: HabitId, current: number) => void;
  incrementHabitProgress: (habitId: HabitId, amount?: number) => void;
  setDailyStreak: (streak: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => void;
  consumeEnergy: (amount: number) => void;
  restoreEnergy: (amount: number) => void;
  claimDailyCheckIn: () => void;
  completePathItem: (habitId: HabitId, pathItemId: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
};

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
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      equippedItemIds: []
    },
    habits: createInitialHabits(),
    dailyStreak: 0,
    longestStreak: 0,
    coins: 0,
    energy: {
      current: 10,
      max: 10,
      lessonCost: 1,
      lastRefillAt: null
    },
    dailyCheckIn: {
      claimedToday: false,
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

const AppContext = createContext<AppContextValue | null>(null);

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function getHabitProgressPercent(habit: HabitState) {
  if (habit.progress.target <= 0) {
    return 0;
  }

  return clamp(Math.round((habit.progress.current / habit.progress.target) * 100), 0, 100);
}

// The reducer is the single place where app-wide game rules update related state atomically.
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.tabId };
    case "SET_ACTIVE_HABIT":
      return { ...state, activeHabitId: action.habitId };
    case "SET_HABIT_PROGRESS": {
      const habit = state.habits[action.habitId];
      const current = clamp(action.current, 0, habit.progress.target);

      return {
        ...state,
        habits: {
          ...state.habits,
          [action.habitId]: {
            ...habit,
            progress: { ...habit.progress, current }
          }
        }
      };
    }
    case "INCREMENT_HABIT_PROGRESS": {
      const habit = state.habits[action.habitId];
      const current = clamp(
        habit.progress.current + action.amount,
        0,
        habit.progress.target
      );

      return {
        ...state,
        habits: {
          ...state.habits,
          [action.habitId]: {
            ...habit,
            progress: { ...habit.progress, current }
          }
        }
      };
    }
    case "SET_DAILY_STREAK":
      return {
        ...state,
        dailyStreak: Math.max(0, action.streak),
        longestStreak: Math.max(state.longestStreak, action.streak)
      };
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
        energy: {
          ...state.energy,
          current: state.energy.current - amount
        }
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
    case "CLAIM_DAILY_CHECK_IN":
      if (state.dailyCheckIn.claimedToday) {
        return state;
      }

      return {
        ...state,
        coins: state.coins + state.dailyCheckIn.rewardCoins,
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
          claimedToday: true,
          lastClaimedAt: action.claimedAt
        }
      };
    case "COMPLETE_PATH_ITEM": {
      const habit = state.habits[action.habitId];
      const completedIndex = habit.pathItems.findIndex((item) => item.id === action.pathItemId);
      const completedItem = habit.pathItems[completedIndex];

      if (
        !completedItem ||
        completedItem.status !== "active" ||
        state.energy.current < state.energy.lessonCost
      ) {
        return state;
      }

      const nextPathItems = habit.pathItems.map((item, index) => {
        if (index === completedIndex) {
          return { ...item, status: "done" as const };
        }

        if (index === completedIndex + 1 && item.status === "locked") {
          return { ...item, status: "active" as const };
        }

        return item;
      });
      const nextProgress = clamp(
        habit.progress.current + completedItem.progressAmount,
        0,
        habit.progress.target
      );

      return {
        ...state,
        coins: state.coins + completedItem.rewardCoins,
        energy: {
          ...state.energy,
          current: state.energy.current - state.energy.lessonCost
        },
        profile: {
          ...state.profile,
          xp: state.profile.xp + completedItem.rewardXp
        },
        habits: {
          ...state.habits,
          [action.habitId]: {
            ...habit,
            xp: habit.xp + completedItem.rewardXp,
            progress: { ...habit.progress, current: nextProgress },
            pathItems: nextPathItems
          }
        },
        activityLog: [
          {
            id: `${action.habitId}-${action.pathItemId}-${action.completedAt}`,
            habitId: action.habitId,
            pathItemId: action.pathItemId,
            completedAt: action.completedAt,
            coinsEarned: completedItem.rewardCoins,
            xpEarned: completedItem.rewardXp
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

type AppStateProviderProps = {
  children: ReactNode;
  initialState?: AppState;
};

export function AppStateProvider({ children, initialState }: AppStateProviderProps) {
  const [state, dispatch] = useReducer(
    appReducer,
    initialState,
    (providedState) => providedState ?? createInitialAppState()
  );
  const habitList = useMemo(() => Object.values(state.habits), [state.habits]);
  const activeHabit = state.habits[state.activeHabitId];
  const activeHabitProgressPercent = getHabitProgressPercent(activeHabit);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      habitList,
      activeHabit,
      activeHabitProgressPercent,
      setActiveTab: (tabId) => dispatch({ type: "SET_ACTIVE_TAB", tabId }),
      setActiveHabit: (habitId) => dispatch({ type: "SET_ACTIVE_HABIT", habitId }),
      setHabitProgress: (habitId, current) =>
        dispatch({ type: "SET_HABIT_PROGRESS", habitId, current }),
      incrementHabitProgress: (habitId, amount = 1) =>
        dispatch({ type: "INCREMENT_HABIT_PROGRESS", habitId, amount }),
      setDailyStreak: (streak) => dispatch({ type: "SET_DAILY_STREAK", streak }),
      addCoins: (amount) => dispatch({ type: "ADD_COINS", amount }),
      spendCoins: (amount) => dispatch({ type: "SPEND_COINS", amount }),
      consumeEnergy: (amount) => dispatch({ type: "CONSUME_ENERGY", amount }),
      restoreEnergy: (amount) =>
        dispatch({ type: "RESTORE_ENERGY", amount, restoredAt: new Date().toISOString() }),
      claimDailyCheckIn: () =>
        dispatch({ type: "CLAIM_DAILY_CHECK_IN", claimedAt: new Date().toISOString() }),
      completePathItem: (habitId, pathItemId) =>
        dispatch({
          type: "COMPLETE_PATH_ITEM",
          habitId,
          pathItemId,
          completedAt: new Date().toISOString()
        }),
      updateSettings: (settings) => dispatch({ type: "UPDATE_SETTINGS", settings })
    }),
    [activeHabit, activeHabitProgressPercent, habitList, state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }

  return context;
}
