import type { HabitId } from "../types/app";
import type { OnboardingStarterReward } from "../types/backend";

export const ONBOARDING_STARTER_REWARD: OnboardingStarterReward = {
  coins: 10,
  xp: 10,
  streakShields: 1
};

const onboardingImportIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isOnboardingImportId(value: string) {
  return onboardingImportIdPattern.test(value);
}

export function createOnboardingImportId() {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid && isOnboardingImportId(randomUuid)) return randomUuid;

  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

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
