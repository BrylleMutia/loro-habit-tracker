export const GOOGLE_LINK_INTENT_KEY = "loro.auth.google-link-intent";
export const AUTH_LINK_INTENT_TTL_MS = 10 * 60 * 1000;

export type AuthLinkIntent = {
  createdAt: number;
  provider: "google";
};

export function parseAuthLinkIntent(raw: string | null): AuthLinkIntent | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AuthLinkIntent>;
    if (
      parsed.provider !== "google" ||
      typeof parsed.createdAt !== "number" ||
      !Number.isFinite(parsed.createdAt) ||
      Date.now() - parsed.createdAt > AUTH_LINK_INTENT_TTL_MS
    ) {
      return null;
    }

    return {
      createdAt: parsed.createdAt,
      provider: "google"
    };
  } catch {
    return null;
  }
}
