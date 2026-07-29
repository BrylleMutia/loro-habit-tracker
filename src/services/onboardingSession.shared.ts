import type { HabitId } from "../types/app";
import { habitOrder } from "../constants/habits";
import type { OnboardingPhase, OnboardingSession, OnboardingSource } from "../types/backend";

export const ONBOARDING_SESSION_KEY = "loro.onboarding.session";
export const ONBOARDING_COMPLETED_KEY = "loro.onboarding.completed";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isHabitId(value: unknown): value is HabitId {
  return isString(value) && habitOrder.includes(value as HabitId);
}

export function parseOnboardingSession(value: unknown): OnboardingSession | null {
  if (!isRecord(value)) return null;

  const phase = value.phase;
  const source = value.source;
  const selectedHabitIds = value.selectedHabitIds;
  if (
    !isString(value.importId) ||
    !["choice", "habits", "quest", "ready", "guest-confirmation", "completed"].includes(
      phase as string
    ) ||
    !["direct-signup", "guest-migration"].includes(source as string) ||
    !Array.isArray(selectedHabitIds) ||
    !selectedHabitIds.every(isHabitId) ||
    (value.firstHabitId !== null && !isHabitId(value.firstHabitId)) ||
    !isBoolean(value.onboardingQuestCompleted) ||
    (value.starterReward !== undefined &&
      value.starterReward !== null &&
      (!isRecord(value.starterReward) ||
        typeof value.starterReward.coins !== "number" ||
        !Number.isFinite(value.starterReward.coins) ||
        value.starterReward.coins < 0 ||
        typeof value.starterReward.xp !== "number" ||
        !Number.isFinite(value.starterReward.xp) ||
        value.starterReward.xp < 0 ||
        typeof value.starterReward.streakShields !== "number" ||
        !Number.isFinite(value.starterReward.streakShields) ||
        value.starterReward.streakShields < 0)) ||
    !isBoolean(value.skippedForNow) ||
    !isString(value.createdAt) ||
    !isString(value.updatedAt)
  ) {
    return null;
  }

  return {
    importId: value.importId,
    phase: phase as OnboardingPhase,
    selectedHabitIds: Array.from(new Set(selectedHabitIds as HabitId[])),
    firstHabitId: value.firstHabitId as HabitId | null,
    onboardingQuestCompleted: value.onboardingQuestCompleted,
    starterReward: value.starterReward === null || value.starterReward === undefined
      ? null
      : {
          coins: value.starterReward.coins as number,
          xp: value.starterReward.xp as number,
          streakShields: value.starterReward.streakShields as number
        },
    skippedForNow: value.skippedForNow,
    source: source as OnboardingSource,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}
