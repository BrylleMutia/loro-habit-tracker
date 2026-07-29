import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { habitOrder } from "../constants/habits";
import type { HabitId } from "../types/app";
import type {
  GuestOnboardingImport,
  GuestOnboardingImportOutcome,
  OnboardingSession
} from "../types/backend";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHabitId(value: unknown): value is HabitId {
  return typeof value === "string" && habitOrder.includes(value as HabitId);
}

export function parseOnboardingImportOutcome(value: unknown): GuestOnboardingImportOutcome {
  if (
    !isRecord(value) ||
    value.kind !== "guest-onboarding-imported" ||
    typeof value.importId !== "string" ||
    (value.source !== "direct-signup" && value.source !== "guest-migration") ||
    typeof value.alreadyImported !== "boolean" ||
    !Array.isArray(value.enabledHabitIds) ||
    value.enabledHabitIds.length === 0 ||
    !value.enabledHabitIds.every(isHabitId) ||
    new Set(value.enabledHabitIds).size !== value.enabledHabitIds.length ||
    typeof value.rewardGranted !== "boolean" ||
    !isRecord(value.starterReward) ||
    typeof value.starterReward.coins !== "number" ||
    !Number.isFinite(value.starterReward.coins) ||
    value.starterReward.coins < 0 ||
    typeof value.starterReward.xp !== "number" ||
    !Number.isFinite(value.starterReward.xp) ||
    value.starterReward.xp < 0 ||
    typeof value.starterReward.streakShields !== "number" ||
    !Number.isFinite(value.starterReward.streakShields) ||
    value.starterReward.streakShields < 0
  ) {
    throw new Error("The server returned an invalid onboarding result.");
  }

  return {
    kind: "guest-onboarding-imported",
    importId: value.importId,
    source: value.source,
    alreadyImported: value.alreadyImported,
    enabledHabitIds: value.enabledHabitIds,
    rewardGranted: value.rewardGranted,
    starterReward: {
      coins: value.starterReward.coins,
      xp: value.starterReward.xp,
      streakShields: value.starterReward.streakShields
    }
  };
}

export async function completeOnboardingImport(session: OnboardingSession) {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured yet.");

  const request: GuestOnboardingImport = {
    importId: session.importId,
    source: session.source,
    selectedHabitIds: session.selectedHabitIds,
    firstHabitId: session.firstHabitId,
    skippedForNow: session.skippedForNow,
    onboardingQuestCompleted: session.onboardingQuestCompleted
  };

  const { data, error } = await supabase.rpc("complete_guest_onboarding", {
    p_import_id: request.importId,
    p_source: request.source,
    p_habit_ids: request.selectedHabitIds,
    p_first_habit_id: request.firstHabitId ?? undefined,
    p_skipped_for_now: request.skippedForNow,
    p_onboarding_quest_completed: request.onboardingQuestCompleted
  });

  if (error) throw error;
  const outcome = parseOnboardingImportOutcome(data);
  if (outcome.importId !== session.importId || outcome.source !== session.source) {
    throw new Error("The server returned an invalid onboarding result.");
  }
  return outcome;
}
