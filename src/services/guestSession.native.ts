import SQLiteStorage from "expo-sqlite/kv-store";

const GUEST_SESSION_KEY = "loro.auth.guest-session";

export async function readGuestSessionEnabled() {
  return (await SQLiteStorage.getItem(GUEST_SESSION_KEY)) === "true";
}

export async function writeGuestSessionEnabled(enabled: boolean) {
  if (enabled) {
    await SQLiteStorage.setItem(GUEST_SESSION_KEY, "true");
    return;
  }

  await SQLiteStorage.removeItem(GUEST_SESSION_KEY);
}
