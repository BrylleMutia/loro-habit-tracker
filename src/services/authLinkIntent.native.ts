import SQLiteStorage from "expo-sqlite/kv-store";

import {
  GOOGLE_LINK_INTENT_KEY,
  parseAuthLinkIntent,
  type AuthLinkIntent
} from "./authLinkIntent.shared";

export async function readGoogleLinkIntent() {
  const intent = parseAuthLinkIntent(await SQLiteStorage.getItem(GOOGLE_LINK_INTENT_KEY));
  if (!intent) await SQLiteStorage.removeItem(GOOGLE_LINK_INTENT_KEY);
  return intent;
}

export async function writeGoogleLinkIntent() {
  const intent: AuthLinkIntent = {
    createdAt: Date.now(),
    provider: "google"
  };
  await SQLiteStorage.setItem(GOOGLE_LINK_INTENT_KEY, JSON.stringify(intent));
}

export async function clearGoogleLinkIntent() {
  await SQLiteStorage.removeItem(GOOGLE_LINK_INTENT_KEY);
}
