import {
  GOOGLE_LINK_INTENT_KEY,
  parseAuthLinkIntent,
  type AuthLinkIntent
} from "./authLinkIntent.shared";

export async function readGoogleLinkIntent() {
  const intent = parseAuthLinkIntent(globalThis.localStorage?.getItem(GOOGLE_LINK_INTENT_KEY) ?? null);
  if (!intent) globalThis.localStorage?.removeItem(GOOGLE_LINK_INTENT_KEY);
  return intent;
}

export async function writeGoogleLinkIntent() {
  const intent: AuthLinkIntent = {
    createdAt: Date.now(),
    provider: "google"
  };
  globalThis.localStorage?.setItem(GOOGLE_LINK_INTENT_KEY, JSON.stringify(intent));
}

export async function clearGoogleLinkIntent() {
  globalThis.localStorage?.removeItem(GOOGLE_LINK_INTENT_KEY);
}
