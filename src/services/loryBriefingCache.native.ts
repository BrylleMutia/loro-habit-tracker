import * as SecureStore from "expo-secure-store";

import type { CachedLoryBriefing } from "../types/loryBriefing";
import {
  getLoryBriefingCacheKey,
  parseCachedLoryBriefing,
  serializeLoryBriefing
} from "./loryBriefingCache.shared";

export async function readCachedLoryBriefing(userId: string, dateKey: string) {
  const key = getLoryBriefingCacheKey(userId, dateKey);
  const cached = await SecureStore.getItemAsync(key);
  if (!cached) return null;

  try {
    const value = parseCachedLoryBriefing(cached);
    return value.dateKey === dateKey ? value : null;
  } catch {
    await SecureStore.deleteItemAsync(key);
    return null;
  }
}

export async function writeCachedLoryBriefing(
  userId: string,
  dateKey: string,
  value: CachedLoryBriefing
) {
  await SecureStore.setItemAsync(
    getLoryBriefingCacheKey(userId, dateKey),
    serializeLoryBriefing(value)
  );
}

export async function clearCachedLoryBriefing(userId: string, dateKey: string) {
  await SecureStore.deleteItemAsync(getLoryBriefingCacheKey(userId, dateKey));
}
