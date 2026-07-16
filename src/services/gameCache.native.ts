import SQLiteStorage from "expo-sqlite/kv-store";

import type { GameResponse } from "../types/backend";
import {
  getGameCacheKey,
  parseCachedGameState,
  serializeGameState
} from "./gameCache.shared";

export async function readCachedGameState(userId: string) {
  const key = getGameCacheKey(userId);
  const cached = await SQLiteStorage.getItem(key);
  if (!cached) return null;

  try {
    return parseCachedGameState(cached);
  } catch {
    await SQLiteStorage.removeItem(key);
    return null;
  }
}

export async function writeCachedGameState(userId: string, response: GameResponse) {
  await SQLiteStorage.setItem(getGameCacheKey(userId), serializeGameState(response));
}

export async function clearCachedGameState(userId: string) {
  await SQLiteStorage.removeItem(getGameCacheKey(userId));
}
