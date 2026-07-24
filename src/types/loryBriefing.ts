import type { DateKey } from "./app";

export const LORY_PROMPT_VERSION = "lory-briefing-v2";
export const LORY_CONTEXT_VERSION = "1";
export const LORY_MAX_MESSAGE_LENGTH = 128;
export const LORY_MAX_DAILY_REFRESHES = 2;

export function getLoryBriefingCharacterCount(value: string) {
  return Array.from(value).length;
}

export type LoryBriefingPendingAction = {
  type:
    | "daily_check_in"
    | "start_quest"
    | "complete_quest"
    | "claim_chapter_reward"
    | "claim_guild_quest";
  habit?: string;
  questType?: "timed" | "one-time";
  title?: string;
};

export type LoryBriefingHabit = {
  name: string;
  streak: number;
  today: "complete" | "pending" | "in_progress" | "path_complete";
  questType?: "timed" | "one-time";
  chapterProgress: string;
  completedLast7Days: number;
};

export type LoryBriefingContext = {
  version: 1;
  date: DateKey;
  timeZone: string;
  player: {
    name: string;
    level: number;
    xpPercent: number;
    dailyStreak: number;
    longestStreak: number;
    coins: number;
    energy: string;
    dailyCheckIn: "pending" | "claimed";
  };
  today: {
    completedHabitCount: number;
    availableHabitCount: number;
    pendingActions: LoryBriefingPendingAction[];
  };
  habits: LoryBriefingHabit[];
  statistics: {
    completedLast7Days: number;
    activeDaysLast7Days: number;
    habitsUsedLast7Days: number;
    strongestHabit: string | null;
    attentionHabit: string | null;
    xpEarnedLast7Days: number;
    coinsEarnedLast7Days: number;
  };
  guild: {
    readyToClaim: number;
    activeQuests: number;
    nearestDeadlineDays: number | null;
  };
};

export type CachedLoryBriefing = {
  dateKey: DateKey;
  message: string;
  promptVersion: string;
  contextVersion: string;
  generatedAt: string;
  refreshCount: number;
};

export type LoryBriefingResponse = {
  dateKey: DateKey;
  message: string | null;
  promptVersion: string;
  contextVersion: string;
  generatedAt: string | null;
  refreshCount: number;
  source: "cached" | "generated" | "pending" | "limit" | "failed";
};
