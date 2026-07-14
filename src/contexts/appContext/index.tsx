import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";

import type {
  AppSettings,
  AppState,
  HabitId,
  HabitState,
  TabId
} from "../../types/app";
import {
  getAdventureSnapshot,
  getEffectiveStreak,
  getLocalDateKey,
  type AdventureSnapshot
} from "../../utility/adventurePath";
import { appReducer, createInitialAppState } from "./appState";

export { createInitialAppState } from "./appState";
export type { InitialAppStateOptions } from "./appState";

type AppContextValue = AppState & {
  todayDateKey: string;
  habitList: HabitState[];
  activeHabit: HabitState;
  activeAdventure: AdventureSnapshot;
  activeHabitProgressPercent: number;
  dailyCheckInClaimedToday: boolean;
  setActiveTab: (tabId: TabId) => void;
  setActiveHabit: (habitId: HabitId) => void;
  startDailyQuest: (habitId: HabitId) => void;
  completeDailyQuest: (habitId: HabitId) => void;
  claimChapterReward: (habitId: HabitId, sectionId: string) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => void;
  consumeEnergy: (amount: number) => void;
  restoreEnergy: (amount: number) => void;
  claimDailyCheckIn: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
};

type AppStateProviderProps = {
  children: ReactNode;
  initialState?: AppState;
};

const AppContext = createContext<AppContextValue | null>(null);

function getActionTime() {
  const now = new Date();
  return { dateKey: getLocalDateKey(now), timestamp: now.toISOString() };
}

export function AppStateProvider({ children, initialState }: AppStateProviderProps) {
  const [state, dispatch] = useReducer(
    appReducer,
    initialState,
    (providedState) => providedState ?? createInitialAppState()
  );
  const todayDateKey = getLocalDateKey();
  const habits = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(state.habits).map(([habitId, habit]) => [
          habitId,
          {
            ...habit,
            streak: getEffectiveStreak(habit.streak, habit.lastCompletedDateKey, todayDateKey)
          }
        ])
      ) as Record<HabitId, HabitState>,
    [state.habits, todayDateKey]
  );
  const habitList = useMemo(() => Object.values(habits), [habits]);
  const activeHabit = habits[state.activeHabitId];
  const activeAdventure = useMemo(
    () => getAdventureSnapshot(activeHabit, todayDateKey),
    [activeHabit, todayDateKey]
  );
  const dailyStreak = getEffectiveStreak(
    state.dailyStreak,
    state.lastStreakDateKey,
    todayDateKey
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      habits,
      dailyStreak,
      todayDateKey,
      habitList,
      activeHabit,
      activeAdventure,
      activeHabitProgressPercent: activeAdventure.chapterProgressPercent,
      dailyCheckInClaimedToday: state.dailyCheckIn.lastClaimedDateKey === todayDateKey,
      setActiveTab: (tabId) => dispatch({ type: "SET_ACTIVE_TAB", tabId }),
      setActiveHabit: (habitId) => dispatch({ type: "SET_ACTIVE_HABIT", habitId }),
      startDailyQuest: (habitId) => {
        const { dateKey, timestamp } = getActionTime();
        dispatch({
          type: "START_DAILY_QUEST",
          habitId,
          dateKey,
          startedAt: timestamp
        });
      },
      completeDailyQuest: (habitId) => {
        const { dateKey, timestamp } = getActionTime();
        dispatch({
          type: "COMPLETE_DAILY_QUEST",
          habitId,
          dateKey,
          completedAt: timestamp
        });
      },
      claimChapterReward: (habitId, sectionId) =>
        dispatch({
          type: "CLAIM_CHAPTER_REWARD",
          habitId,
          sectionId,
          claimedAt: new Date().toISOString()
        }),
      addCoins: (amount) => dispatch({ type: "ADD_COINS", amount }),
      spendCoins: (amount) => dispatch({ type: "SPEND_COINS", amount }),
      consumeEnergy: (amount) => dispatch({ type: "CONSUME_ENERGY", amount }),
      restoreEnergy: (amount) =>
        dispatch({ type: "RESTORE_ENERGY", amount, restoredAt: new Date().toISOString() }),
      claimDailyCheckIn: () => {
        const { dateKey, timestamp } = getActionTime();
        dispatch({ type: "CLAIM_DAILY_CHECK_IN", dateKey, claimedAt: timestamp });
      },
      updateSettings: (settings) => dispatch({ type: "UPDATE_SETTINGS", settings })
    }),
    [
      activeAdventure,
      activeHabit,
      dailyStreak,
      habitList,
      habits,
      state,
      todayDateKey
    ]
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
