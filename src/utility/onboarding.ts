import type { HabitId } from "../types/app";
import type { OnboardingStarterReward } from "../types/backend";

export const ONBOARDING_STARTER_REWARD: OnboardingStarterReward = {
  coins: 10,
  xp: 10,
  streakShields: 1
};

export function toggleOnboardingHabitSelection(selectedHabitIds: readonly HabitId[], habitId: HabitId) {
  return selectedHabitIds.includes(habitId)
    ? selectedHabitIds.filter((selectedId) => selectedId !== habitId)
    : [...selectedHabitIds, habitId];
}

export function resolveOnboardingHabitIds(
  catalogHabitIds: readonly HabitId[],
  selectedHabitIds: readonly HabitId[],
  skippedForNow: boolean
) {
  if (skippedForNow) return [...catalogHabitIds];
  return selectedHabitIds.filter((habitId, index, ids) => ids.indexOf(habitId) === index && catalogHabitIds.includes(habitId));
}
