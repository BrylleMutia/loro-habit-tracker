import type { AppState, DateKey, HabitId } from "./app";

export type PersistedGameState = Omit<AppState, "activeHabitId" | "activeTab">;

export type AuthStatus =
  | "awaitingVerification"
  | "booting"
  | "guest"
  | "passwordRecovery"
  | "signedIn"
  | "signedOut";

export type AuthView = "forgotPassword" | "signIn" | "signUp";
export type AwaitingAuthAction = "passwordReset" | "verification";

export type SyncStatus = "error" | "loading" | "offline" | "ready" | "refreshing";

export type GameMutationId =
  | "chapter-reward"
  | "daily-check-in"
  | "profile"
  | "quest-complete"
  | "quest-start"
  | "settings";

export type QuestStartOutcome = {
  kind: "quest-started";
  habitId: HabitId;
  nodeId: string;
  startedAt: string;
  alreadyStarted: boolean;
};

export type QuestCompletionOutcome = {
  kind: "quest-completed";
  habitId: HabitId;
  nodeId: string;
  sectionId: string;
  coinReward: number;
  xpReward: number;
  streak: number;
  alreadyCompleted: boolean;
};

export type RewardClaimOutcome = {
  kind: "chapter-reward-claimed";
  habitId: HabitId;
  sectionId: string;
  coinReward: number;
  xpReward: number;
  alreadyClaimed: boolean;
};

export type CheckInOutcome = {
  kind: "daily-check-in-claimed";
  coinReward: number;
  energyReward: number;
  alreadyClaimed: boolean;
};

export type SnapshotOutcome = { kind: "snapshot" };
export type SettingsUpdatedOutcome = { kind: "settings-updated" };
export type ProfileUpdatedOutcome = { kind: "profile-updated" };

export type GameOutcome =
  | CheckInOutcome
  | ProfileUpdatedOutcome
  | QuestCompletionOutcome
  | QuestStartOutcome
  | RewardClaimOutcome
  | SettingsUpdatedOutcome
  | SnapshotOutcome;

export type GameResponse<TOutcome extends GameOutcome = GameOutcome> = {
  snapshot: PersistedGameState;
  outcome: TOutcome;
  serverNow: string;
  localDateKey: DateKey;
};

export type GameErrorCode =
  | "CHAPTER_INCOMPLETE"
  | "CONFIGURATION_ERROR"
  | "INSUFFICIENT_ENERGY"
  | "INVALID_CHAPTER"
  | "INVALID_AVATAR_CLASS"
  | "INVALID_AVATAR_VARIANT"
  | "INVALID_DISPLAY_NAME"
  | "INVALID_HABIT"
  | "INVALID_RESPONSE"
  | "INVALID_TIME_ZONE"
  | "NETWORK_ERROR"
  | "OFFLINE"
  | "PATH_COMPLETE"
  | "PROFILE_NOT_FOUND"
  | "QUEST_ALREADY_COMPLETED"
  | "QUEST_NOT_TIMED"
  | "SETTINGS_NOT_FOUND"
  | "TIMER_NOT_FINISHED"
  | "TIMER_NOT_STARTED"
  | "UNAUTHENTICATED"
  | "UNKNOWN";

export class GameRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: GameErrorCode,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "GameRepositoryError";
  }
}
