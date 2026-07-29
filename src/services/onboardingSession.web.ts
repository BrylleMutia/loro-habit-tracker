import type { OnboardingSession } from "../types/backend";
import {
  ONBOARDING_COMPLETED_KEY,
  ONBOARDING_SESSION_KEY,
  parseOnboardingSession
} from "./onboardingSession.shared";

export async function readOnboardingSession() {
  const raw = globalThis.localStorage?.getItem(ONBOARDING_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = parseOnboardingSession(JSON.parse(raw));
    if (!parsed) globalThis.localStorage?.removeItem(ONBOARDING_SESSION_KEY);
    return parsed;
  } catch {
    globalThis.localStorage?.removeItem(ONBOARDING_SESSION_KEY);
    return null;
  }
}

export async function writeOnboardingSession(session: OnboardingSession) {
  globalThis.localStorage?.setItem(ONBOARDING_SESSION_KEY, JSON.stringify(session));
}

export async function clearOnboardingSession() {
  globalThis.localStorage?.removeItem(ONBOARDING_SESSION_KEY);
}

export async function readOnboardingCompleted() {
  return globalThis.localStorage?.getItem(ONBOARDING_COMPLETED_KEY) === "true";
}

export async function writeOnboardingCompleted(completed: boolean) {
  if (completed) {
    globalThis.localStorage?.setItem(ONBOARDING_COMPLETED_KEY, "true");
  } else {
    globalThis.localStorage?.removeItem(ONBOARDING_COMPLETED_KEY);
  }
}
