import type { GameResponse } from "../types/backend";
import {
  getGameCacheKey,
  parseCachedGameState,
  serializeGameState
} from "./gameCache.shared";

// Metro selects gameCache.native.ts or gameCache.web.ts. This memory fallback
// keeps TypeScript and non-Metro tooling platform-neutral.
const memoryCache = new Map<string, string>();

export async function readCachedGameState(userId: string) {
  const key = getGameCacheKey(userId);
  const cached = memoryCache.get(key);
  if (!cached) return null;

  try {
    return parseCachedGameState(cached);
  } catch {
    memoryCache.delete(key);
    return null;
  }
}

export async function writeCachedGameState(userId: string, response: GameResponse) {
  memoryCache.set(getGameCacheKey(userId), serializeGameState(response));
}

export async function clearCachedGameState(userId: string) {
  memoryCache.delete(getGameCacheKey(userId));
}
