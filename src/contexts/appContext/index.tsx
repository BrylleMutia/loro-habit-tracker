import * as Network from "expo-network";
import {
  AppState as NativeAppState,
  type AppStateStatus
} from "react-native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode
} from "react";

import {
  claimChapterReward as claimChapterRewardRemote,
  claimDailyCheckIn as claimDailyCheckInRemote,
  completeDailyQuest as completeDailyQuestRemote,
  getGameSnapshot,
  startDailyQuest as startDailyQuestRemote,
  updateProfile as updateProfileRemote,
  updateSettings as updateSettingsRemote
} from "../../services/gameRepository";
import { readCachedGameState, writeCachedGameState } from "../../services/gameCache";
import type {
  AppSettings,
  AppState,
  HabitId,
  HabitState,
  PlayerProfile,
  TabId
} from "../../types/app";
import type {
  CheckInOutcome,
  GameMutationId,
  GameResponse,
  ProfileUpdatedOutcome,
  QuestCompletionOutcome,
  QuestStartOutcome,
  RewardClaimOutcome,
  SettingsUpdatedOutcome,
  SyncStatus
} from "../../types/backend";
import { GameRepositoryError } from "../../types/backend";
import {
  getAdventureSnapshot,
  getEffectiveStreak,
  type AdventureSnapshot
} from "../../utility/adventurePath";
import { appReducer, createInitialAppState } from "./appState";

export { createInitialAppState } from "./appState";
export type { InitialAppStateOptions } from "./appState";

type EditableProfileFields = Partial<
  Pick<PlayerProfile, "avatarClassId" | "avatarVariant" | "name">
>;

type AppContextValue = AppState & {
  todayDateKey: string;
  habitList: HabitState[];
  activeHabit: HabitState;
  activeAdventure: AdventureSnapshot;
  activeHabitProgressPercent: number;
  dailyCheckInClaimedToday: boolean;
  syncStatus: SyncStatus;
  syncError: GameRepositoryError | null;
  mutationInFlight: GameMutationId | null;
  lastSyncedAt: string | null;
  hasHydrated: boolean;
  isOnline: boolean;
  serverClockOffsetMs: number;
  setActiveTab: (tabId: TabId) => void;
  setActiveHabit: (habitId: HabitId) => void;
  startDailyQuest: (habitId: HabitId) => Promise<QuestStartOutcome>;
  completeDailyQuest: (habitId: HabitId) => Promise<QuestCompletionOutcome>;
  claimChapterReward: (habitId: HabitId, sectionId: string) => Promise<RewardClaimOutcome>;
  claimDailyCheckIn: () => Promise<CheckInOutcome>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<SettingsUpdatedOutcome>;
  updateProfile: (fields: EditableProfileFields) => Promise<ProfileUpdatedOutcome>;
  refreshGameState: () => Promise<void>;
  clearSyncError: () => void;
};

type AppStateProviderProps = {
  children: ReactNode;
  userId: string;
  initialState?: AppState;
};

const AppContext = createContext<AppContextValue | null>(null);

function toGameError(error: unknown) {
  return error instanceof GameRepositoryError
    ? error
    : new GameRepositoryError(
        error instanceof Error ? error.message : "Something interrupted the trail.",
        "UNKNOWN",
        error
      );
}

function getDateKeyInTimeZone(timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function AppStateProvider({ children, initialState, userId }: AppStateProviderProps) {
  const [state, dispatch] = useReducer(
    appReducer,
    initialState,
    (providedState) => providedState ?? createInitialAppState({ playerId: userId })
  );
  const [todayDateKey, setTodayDateKey] = useState(() =>
    getDateKeyInTimeZone(state.settings.timeZone)
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    initialState ? "ready" : "loading"
  );
  const [syncError, setSyncError] = useState<GameRepositoryError | null>(null);
  const [mutationInFlight, setMutationInFlight] = useState<GameMutationId | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(Boolean(initialState));
  const [isOnline, setIsOnline] = useState(true);
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState(0);
  const providerActiveRef = useRef(true);
  const hasHydratedRef = useRef(Boolean(initialState));
  const isOnlineRef = useRef(true);
  const mutationInFlightRef = useRef<GameMutationId | null>(null);
  const refreshInFlightRef = useRef<Promise<void> | null>(null);

  const applyResponse = useCallback(
    async (response: GameResponse, shouldCache = true) => {
      if (!providerActiveRef.current) return;

      dispatch({ type: "HYDRATE_GAME_STATE", snapshot: response.snapshot });
      setTodayDateKey(response.localDateKey);
      setServerClockOffsetMs(Date.parse(response.serverNow) - Date.now());
      setLastSyncedAt(response.serverNow);
      setHasHydrated(true);
      hasHydratedRef.current = true;
      setSyncError(null);
      setSyncStatus("ready");
      if (shouldCache && providerActiveRef.current) {
        // A cache failure must never turn a committed server mutation into a UI failure.
        await writeCachedGameState(userId, response).catch(() => undefined);
      }
    },
    [userId]
  );

  const refreshGameState = useCallback(() => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    const refresh = (async () => {
      if (!isOnlineRef.current) {
        setSyncStatus("offline");
        return;
      }

      setSyncStatus(hasHydratedRef.current ? "refreshing" : "loading");
      try {
        await applyResponse(await getGameSnapshot());
      } catch (error) {
        const gameError = toGameError(error);
        setSyncError(gameError);
        setSyncStatus(
          gameError.code === "NETWORK_ERROR" && hasHydratedRef.current ? "offline" : "error"
        );
      }
    })().finally(() => {
      refreshInFlightRef.current = null;
    });

    refreshInFlightRef.current = refresh;
    return refresh;
  }, [applyResponse]);

  useEffect(() => {
    providerActiveRef.current = true;
    let isMounted = true;

    void readCachedGameState(userId).then((cachedResponse) => {
      if (!isMounted || !cachedResponse || hasHydratedRef.current) return;
      void applyResponse(cachedResponse, false);
    });

    void Network.getNetworkStateAsync()
      .then((networkState) => {
        if (!isMounted) return;
        const online = networkState.isConnected !== false && networkState.isInternetReachable !== false;
        isOnlineRef.current = online;
        setIsOnline(online);
        if (online) void refreshGameState();
        else setSyncStatus("offline");
      })
      .catch(() => {
        if (isMounted) void refreshGameState();
      });

    const networkSubscription = Network.addNetworkStateListener((networkState) => {
      const online = networkState.isConnected !== false && networkState.isInternetReachable !== false;
      const wasOnline = isOnlineRef.current;
      isOnlineRef.current = online;
      setIsOnline(online);
      if (!online) setSyncStatus("offline");
      if (online && !wasOnline) void refreshGameState();
    });
    const appStateSubscription = NativeAppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active" && isOnlineRef.current) void refreshGameState();
      }
    );

    return () => {
      isMounted = false;
      providerActiveRef.current = false;
      networkSubscription.remove();
      appStateSubscription.remove();
    };
  }, [applyResponse, refreshGameState, userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentDateKey = getDateKeyInTimeZone(state.settings.timeZone);
      if (currentDateKey !== todayDateKey) {
        setTodayDateKey(currentDateKey);
        if (isOnlineRef.current) void refreshGameState();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [refreshGameState, state.settings.timeZone, todayDateKey]);

  const runMutation = useCallback(
    async <TOutcome,>(
      mutationId: GameMutationId,
      request: () => Promise<GameResponse & { outcome: TOutcome }>
    ) => {
      if (!isOnlineRef.current) {
        const offlineError = new GameRepositoryError(
          "Reconnect to continue your adventure. Cached progress is still available.",
          "OFFLINE"
        );
        setSyncError(offlineError);
        setSyncStatus("offline");
        throw offlineError;
      }
      if (mutationInFlightRef.current) {
        throw new GameRepositoryError("Another trail action is still syncing.", "UNKNOWN");
      }

      mutationInFlightRef.current = mutationId;
      setMutationInFlight(mutationId);
      setSyncError(null);
      try {
        const response = await request();
        await applyResponse(response);
        return response.outcome;
      } catch (error) {
        const gameError = toGameError(error);
        setSyncError(gameError);
        setSyncStatus(gameError.code === "NETWORK_ERROR" ? "offline" : "error");
        throw gameError;
      } finally {
        mutationInFlightRef.current = null;
        if (providerActiveRef.current) setMutationInFlight(null);
      }
    },
    [applyResponse]
  );

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
      syncStatus,
      syncError,
      mutationInFlight,
      lastSyncedAt,
      hasHydrated,
      isOnline,
      serverClockOffsetMs,
      setActiveTab: (tabId) => dispatch({ type: "SET_ACTIVE_TAB", tabId }),
      setActiveHabit: (habitId) => dispatch({ type: "SET_ACTIVE_HABIT", habitId }),
      startDailyQuest: (habitId) =>
        runMutation("quest-start", () => startDailyQuestRemote(habitId)),
      completeDailyQuest: (habitId) =>
        runMutation("quest-complete", () => completeDailyQuestRemote(habitId)),
      claimChapterReward: (habitId, sectionId) =>
        runMutation("chapter-reward", () => claimChapterRewardRemote(habitId, sectionId)),
      claimDailyCheckIn: () =>
        runMutation("daily-check-in", () => claimDailyCheckInRemote()),
      updateSettings: (settings) =>
        runMutation("settings", () => updateSettingsRemote(settings)),
      updateProfile: (fields) =>
        runMutation("profile", () => updateProfileRemote(fields)),
      refreshGameState,
      clearSyncError: () => setSyncError(null)
    }),
    [
      activeAdventure,
      activeHabit,
      dailyStreak,
      habitList,
      habits,
      hasHydrated,
      isOnline,
      lastSyncedAt,
      mutationInFlight,
      refreshGameState,
      runMutation,
      serverClockOffsetMs,
      state,
      syncError,
      syncStatus,
      todayDateKey
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppState must be used within an AppStateProvider");
  return context;
}
