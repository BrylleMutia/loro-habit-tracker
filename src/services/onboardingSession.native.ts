import SQLiteStorage from "expo-sqlite/kv-store";

import type { OnboardingSession } from "../types/backend";
import {
  ONBOARDING_COMPLETED_KEY,
  ONBOARDING_SESSION_KEY,
  parseOnboardingSession
} from "./onboardingSession.shared";

export async function readOnboardingSession() {
  const raw = await SQLiteStorage.getItem(ONBOARDING_SESSION_KEY);
  if (!raw) return null;
  const parsed = parseOnboardingSession(JSON.parse(raw));
  if (!parsed) await SQLiteStorage.removeItem(ONBOARDING_SESSION_KEY);
  return parsed;
}

export async function writeOnboardingSession(session: OnboardingSession) {
  await SQLiteStorage.setItem(ONBOARDING_SESSION_KEY, JSON.stringify(session));
}

export async function clearOnboardingSession() {
  await SQLiteStorage.removeItem(ONBOARDING_SESSION_KEY);
}

export async function readOnboardingCompleted() {
  return (await SQLiteStorage.getItem(ONBOARDING_COMPLETED_KEY)) === "true";
}

export async function writeOnboardingCompleted(completed: boolean) {
  if (completed) {
    await SQLiteStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
  } else {
    await SQLiteStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  }
}
