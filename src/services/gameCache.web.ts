import type { GameResponse } from "../types/backend";
import {
  getGameCacheKey,
  parseCachedGameState,
  serializeGameState
} from "./gameCache.shared";

export async function readCachedGameState(userId: string) {
  const key = getGameCacheKey(userId);
  const cached = globalThis.localStorage?.getItem(key);
  if (!cached) return null;

  try {
    return parseCachedGameState(cached);
  } catch {
    globalThis.localStorage?.removeItem(key);
    return null;
  }
}

export async function writeCachedGameState(userId: string, response: GameResponse) {
  globalThis.localStorage?.setItem(getGameCacheKey(userId), serializeGameState(response));
}

export async function clearCachedGameState(userId: string) {
  globalThis.localStorage?.removeItem(getGameCacheKey(userId));
}
