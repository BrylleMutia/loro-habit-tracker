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
  equipItem as equipItemRemote,
  getGameSnapshot,
  acceptGuildQuest as acceptGuildQuestRemote,
  claimGuildQuestReward as claimGuildQuestRewardRemote,
  startDailyQuest as startDailyQuestRemote,
  updateProfile as updateProfileRemote,
  updateSettings as updateSettingsRemote
} from "../../services/gameRepository";
import { readCachedGameState, writeCachedGameState } from "../../services/gameCache";
import {
  claimLocalChapterReward,
  claimLocalDailyCheckIn,
  completeLocalDailyQuest,
  equipLocalItem,
  getLocalGameSnapshot,
  acceptLocalGuildQuest,
  claimLocalGuildQuestReward,
  startLocalDailyQuest,
  updateLocalProfile,
  updateLocalSettings
} from "../../services/localGameRepository";
import { habitOrder } from "../../constants/habits";
import type {
  AppSettings,
  AppState,
  GuildQuestKind,
  GuildQuestRewardPreview,
  HabitId,
  HabitState,
  PlayerProfile
} from "../../types/app";
import type {
  CheckInOutcome,
  EquipmentUpdatedOutcome,
  GuildQuestAcceptanceOutcome,
  GuildQuestRewardOutcome,
  GameMutationId,
  GameResponse,
  ProfileUpdatedOutcome,
  QuestCompletionOutcome,
  QuestStartOutcome,
  RewardClaimOutcome,
  SettingsUpdatedOutcome,
  SyncStatus
} from "../../types/backend";
import type { LoryBriefingContext } from "../../types/loryBriefing";
import { GameRepositoryError } from "../../types/backend";
import {
  getAdventureSnapshot,
  getEffectiveStreak,
  type AdventureSnapshot
} from "../../utility/adventurePath";
import {
  getGuildQuestViews,
  getGuildQuestRewardPreviewSelection,
  type GuildQuestView
} from "../../utility/guildQuests";
import { buildLoryBriefingContext } from "../../utility/loryBriefing";
import { appReducer, createInitialAppState } from "./appState";

export { createInitialAppState } from "./appState";
export type { InitialAppStateOptions } from "./appState";

type EditableProfileFields = Partial<
  Pick<PlayerProfile, "avatarClassId" | "avatarVariant" | "name" | "setCollectionOrder">
>;

type GameHabitsContextValue = {
  activeHabitId: HabitId;
  habitList: HabitState[];
  activeHabit: HabitState;
  activeAdventure: AdventureSnapshot;
  activeHabitProgressPercent: number;
};

type GameProfileContextValue = {
  profile: PlayerProfile;
  dailyStreak: number;
  longestStreak: number;
};

type GameInventoryContextValue = {
  inventory: AppState["inventory"];
};

type GameResourcesContextValue = {
  coins: number;
  energy: AppState["energy"];
  dailyCheckIn: AppState["dailyCheckIn"];
  dailyCheckInClaimedToday: boolean;
};

type GameQuestsContextValue = {
  sideCandidates: GuildQuestView[];
  mainCandidates: GuildQuestView[];
  timeZone: string;
};

type GameSyncContextValue = {
  todayDateKey: string;
  syncStatus: SyncStatus;
  syncError: GameRepositoryError | null;
  mutationInFlight: GameMutationId | null;
  lastSyncedAt: string | null;
  hasHydrated: boolean;
  isOnline: boolean;
  serverClockOffsetMs: number;
};

type GameBriefingContextValue = {
  briefingContext: LoryBriefingContext;
};

type GameActionsContextValue = {
  setActiveHabit: (habitId: HabitId) => void;
  startDailyQuest: (habitId: HabitId) => Promise<QuestStartOutcome>;
  completeDailyQuest: (habitId: HabitId) => Promise<QuestCompletionOutcome>;
  claimChapterReward: (habitId: HabitId, sectionId: string) => Promise<RewardClaimOutcome>;
  acceptGuildQuest: (questKind: GuildQuestKind, questId: string) => Promise<GuildQuestAcceptanceOutcome>;
  claimGuildQuestReward: (questKind: GuildQuestKind, questId: string) => Promise<GuildQuestRewardOutcome>;
  claimDailyCheckIn: () => Promise<CheckInOutcome>;
  equipItem: (itemId: string) => Promise<EquipmentUpdatedOutcome>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<SettingsUpdatedOutcome>;
  updateProfile: (fields: EditableProfileFields) => Promise<ProfileUpdatedOutcome>;
  refreshGameState: () => Promise<void>;
  clearSyncError: () => void;
};

type AppStateProviderProps = {
  children: ReactNode;
  userId: string;
  initialState?: AppState;
  storageMode?: "local" | "remote";
};

const GameHabitsContext = createContext<GameHabitsContextValue | null>(null);
const GameProfileContext = createContext<GameProfileContextValue | null>(null);
const GameInventoryContext = createContext<GameInventoryContextValue | null>(null);
const GameResourcesContext = createContext<GameResourcesContextValue | null>(null);
const GameQuestsContext = createContext<GameQuestsContextValue | null>(null);
const GameSyncContext = createContext<GameSyncContextValue | null>(null);
const GameBriefingContext = createContext<GameBriefingContextValue | null>(null);
const GameActionsContext = createContext<GameActionsContextValue | null>(null);

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

export function AppStateProvider({
  children,
  initialState,
  storageMode = "remote",
  userId
}: AppStateProviderProps) {
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
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const applyResponse = useCallback(
    async (response: GameResponse, shouldCache = true) => {
      if (!providerActiveRef.current) return;

      stateRef.current = {
        ...response.snapshot,
        activeHabitId: stateRef.current.activeHabitId
      };
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
      if (storageMode === "local") {
        setSyncStatus(hasHydratedRef.current ? "refreshing" : "loading");
        const cached = await readCachedGameState(userId);
        await applyResponse(
          cached ??
            getLocalGameSnapshot(
              stateRef.current,
              getDateKeyInTimeZone(stateRef.current.settings.timeZone)
            )
        );
        return;
      }

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
  }, [applyResponse, storageMode, userId]);

  useEffect(() => {
    providerActiveRef.current = true;
    let isMounted = true;

    if (storageMode === "local") {
      isOnlineRef.current = true;
      setIsOnline(true);
      void readCachedGameState(userId).then((cachedResponse) => {
        if (!isMounted) return;
        void applyResponse(
          cachedResponse ??
            getLocalGameSnapshot(
              stateRef.current,
              getDateKeyInTimeZone(stateRef.current.settings.timeZone)
            )
        );
      });

      return () => {
        isMounted = false;
        providerActiveRef.current = false;
      };
    }

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
  }, [applyResponse, refreshGameState, storageMode, userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentDateKey = getDateKeyInTimeZone(state.settings.timeZone);
      if (currentDateKey !== todayDateKey) {
        setTodayDateKey(currentDateKey);
        if (storageMode === "local" || isOnlineRef.current) void refreshGameState();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [refreshGameState, state.settings.timeZone, storageMode, todayDateKey]);

  const runMutation = useCallback(
    async <TOutcome,>(
      mutationId: GameMutationId,
      request: () => Promise<GameResponse & { outcome: TOutcome }>
    ) => {
      if (storageMode === "remote" && !isOnlineRef.current) {
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
    [applyResponse, storageMode]
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
  const habitList = useMemo(
    () => habitOrder.map((habitId) => habits[habitId]).filter(Boolean),
    [habits]
  );
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

  const setActiveHabit = useCallback(
    (habitId: HabitId) => dispatch({ type: "SET_ACTIVE_HABIT", habitId }),
    []
  );
  const startDailyQuest = useCallback(
    (habitId: HabitId) =>
      runMutation("quest-start", async () =>
        storageMode === "local"
          ? startLocalDailyQuest(stateRef.current, habitId, todayDateKey)
          : startDailyQuestRemote(habitId)
      ),
    [runMutation, storageMode, todayDateKey]
  );
  const completeDailyQuest = useCallback(
    (habitId: HabitId) =>
      runMutation("quest-complete", async () =>
        storageMode === "local"
          ? completeLocalDailyQuest(stateRef.current, habitId, todayDateKey)
          : completeDailyQuestRemote(habitId)
      ),
    [runMutation, storageMode, todayDateKey]
  );
  const claimChapterReward = useCallback(
    (habitId: HabitId, sectionId: string) =>
      runMutation("chapter-reward", async () =>
        storageMode === "local"
          ? claimLocalChapterReward(stateRef.current, habitId, sectionId, todayDateKey)
          : claimChapterRewardRemote(habitId, sectionId)
      ),
    [runMutation, storageMode, todayDateKey]
  );
  const acceptGuildQuest = useCallback(
    (questKind: GuildQuestKind, questId: string) => {
      const quest = getGuildQuestViews(stateRef.current, todayDateKey, questKind).find(
        (candidate) => candidate.definition.id === questId
      );
      if (!quest) {
        return Promise.reject(
          new GameRepositoryError("That Guild Quest is no longer available.", "GUILD_QUEST_INVALID_SELECTION")
        );
      }
      const rewardPreview: GuildQuestRewardPreview = getGuildQuestRewardPreviewSelection(quest);

      return runMutation("guild-quest-accept", async () =>
        storageMode === "local"
          ? acceptLocalGuildQuest(
              stateRef.current,
              questKind,
              questId,
              todayDateKey,
              rewardPreview
            )
          : acceptGuildQuestRemote(questKind, questId, rewardPreview)
      );
    },
    [runMutation, storageMode, todayDateKey]
  );
  const claimGuildQuestReward = useCallback(
    (questKind: GuildQuestKind, questId: string) =>
      runMutation("guild-quest-claim", async () =>
        storageMode === "local"
          ? claimLocalGuildQuestReward(stateRef.current, questKind, questId, todayDateKey)
          : claimGuildQuestRewardRemote(questKind, questId)
      ),
    [runMutation, storageMode, todayDateKey]
  );
  const claimDailyCheckIn = useCallback(
    () =>
      runMutation("daily-check-in", async () =>
        storageMode === "local"
          ? claimLocalDailyCheckIn(stateRef.current, todayDateKey)
          : claimDailyCheckInRemote()
      ),
    [runMutation, storageMode, todayDateKey]
  );
  const equipItem = useCallback(
    (itemId: string) =>
      runMutation("equipment", async () =>
        storageMode === "local"
          ? equipLocalItem(stateRef.current, itemId, todayDateKey)
          : equipItemRemote(itemId)
      ),
    [runMutation, storageMode, todayDateKey]
  );
  const updateSettings = useCallback(
    (settings: Partial<AppSettings>) =>
      runMutation("settings", async () =>
        storageMode === "local"
          ? updateLocalSettings(stateRef.current, settings, todayDateKey)
          : updateSettingsRemote(settings)
      ),
    [runMutation, storageMode, todayDateKey]
  );
  const updateProfile = useCallback(
    (fields: EditableProfileFields) =>
      runMutation("profile", async () =>
        storageMode === "local"
          ? updateLocalProfile(stateRef.current, fields, todayDateKey)
          : updateProfileRemote(fields)
      ),
    [runMutation, storageMode, todayDateKey]
  );
  const clearSyncError = useCallback(() => setSyncError(null), []);

  const habitsValue = useMemo<GameHabitsContextValue>(
    () => ({
      activeHabitId: state.activeHabitId,
      habitList,
      activeHabit,
      activeAdventure,
      activeHabitProgressPercent: activeAdventure.chapterProgressPercent
    }),
    [activeAdventure, activeHabit, habitList, state.activeHabitId]
  );
  const profileValue = useMemo<GameProfileContextValue>(
    () => ({ profile: state.profile, dailyStreak, longestStreak: state.longestStreak }),
    [dailyStreak, state.longestStreak, state.profile]
  );
  const inventoryValue = useMemo<GameInventoryContextValue>(
    () => ({ inventory: state.inventory }),
    [state.inventory]
  );
  const resourcesValue = useMemo<GameResourcesContextValue>(
    () => ({
      coins: state.coins,
      energy: state.energy,
      dailyCheckIn: state.dailyCheckIn,
      dailyCheckInClaimedToday: state.dailyCheckIn.lastClaimedDateKey === todayDateKey
    }),
    [state.coins, state.dailyCheckIn, state.energy, todayDateKey]
  );
  const questsValue = useMemo<GameQuestsContextValue>(() => {
    const sideCandidates = getGuildQuestViews(state, todayDateKey, "side");
    const mainCandidates = getGuildQuestViews(state, todayDateKey, "main");
    return {
      sideCandidates,
      mainCandidates,
      timeZone: state.settings.timeZone
    };
  }, [state.activityLog, state.guildQuestBoard, state.habits, state.settings.timeZone, todayDateKey]);
  const syncValue = useMemo<GameSyncContextValue>(
    () => ({
      todayDateKey,
      syncStatus,
      syncError,
      mutationInFlight,
      lastSyncedAt,
      hasHydrated,
      isOnline,
      serverClockOffsetMs
    }),
    [
      hasHydrated,
      isOnline,
      lastSyncedAt,
      mutationInFlight,
      serverClockOffsetMs,
      syncError,
      syncStatus,
      todayDateKey
    ]
  );
  const briefingValue = useMemo<GameBriefingContextValue>(
    () => ({ briefingContext: buildLoryBriefingContext(state, todayDateKey) }),
    [state, todayDateKey]
  );
  const actionsValue = useMemo<GameActionsContextValue>(
    () => ({
      setActiveHabit,
      startDailyQuest,
      completeDailyQuest,
      claimChapterReward,
      acceptGuildQuest,
      claimGuildQuestReward,
      claimDailyCheckIn,
      equipItem,
      updateSettings,
      updateProfile,
      refreshGameState,
      clearSyncError
    }),
    [
      claimChapterReward,
      claimDailyCheckIn,
      clearSyncError,
      completeDailyQuest,
      equipItem,
      claimGuildQuestReward,
      refreshGameState,
      setActiveHabit,
      startDailyQuest,
      acceptGuildQuest,
      updateProfile,
      updateSettings
    ]
  );

  return (
    <GameHabitsContext.Provider value={habitsValue}>
      <GameProfileContext.Provider value={profileValue}>
        <GameInventoryContext.Provider value={inventoryValue}>
          <GameResourcesContext.Provider value={resourcesValue}>
            <GameQuestsContext.Provider value={questsValue}>
              <GameSyncContext.Provider value={syncValue}>
                <GameBriefingContext.Provider value={briefingValue}>
                  <GameActionsContext.Provider value={actionsValue}>
                    {children}
                  </GameActionsContext.Provider>
                </GameBriefingContext.Provider>
              </GameSyncContext.Provider>
            </GameQuestsContext.Provider>
          </GameResourcesContext.Provider>
        </GameInventoryContext.Provider>
      </GameProfileContext.Provider>
    </GameHabitsContext.Provider>
  );
}

function useRequiredContext<T>(context: React.Context<T | null>, hookName: string) {
  const value = useContext(context);
  if (!value) throw new Error(`${hookName} must be used within an AppStateProvider`);
  return value;
}

export function useGameHabits() {
  return useRequiredContext(GameHabitsContext, "useGameHabits");
}

export function useGameProfile() {
  return useRequiredContext(GameProfileContext, "useGameProfile");
}

export function useGameInventory() {
  return useRequiredContext(GameInventoryContext, "useGameInventory");
}

export function useGameResources() {
  return useRequiredContext(GameResourcesContext, "useGameResources");
}

export function useGameQuests() {
  return useRequiredContext(GameQuestsContext, "useGameQuests");
}

export function useGameSync() {
  return useRequiredContext(GameSyncContext, "useGameSync");
}

export function useGameBriefing() {
  return useRequiredContext(GameBriefingContext, "useGameBriefing");
}

export function useGameActions() {
  return useRequiredContext(GameActionsContext, "useGameActions");
}
