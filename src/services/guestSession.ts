let guestSessionEnabled = false;

// Metro selects the native or web implementation. This memory fallback keeps
// TypeScript and non-Metro tooling platform-neutral.
export async function readGuestSessionEnabled() {
  return guestSessionEnabled;
}

export async function writeGuestSessionEnabled(enabled: boolean) {
  guestSessionEnabled = enabled;
}
