const GUEST_SESSION_KEY = "loro.auth.guest-session";

export async function readGuestSessionEnabled() {
  return globalThis.localStorage?.getItem(GUEST_SESSION_KEY) === "true";
}

export async function writeGuestSessionEnabled(enabled: boolean) {
  if (enabled) {
    globalThis.localStorage?.setItem(GUEST_SESSION_KEY, "true");
    return;
  }

  globalThis.localStorage?.removeItem(GUEST_SESSION_KEY);
}
