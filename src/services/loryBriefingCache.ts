import type { CachedLoryBriefing } from "../types/loryBriefing";
import {
  getLoryBriefingCacheKey,
  parseCachedLoryBriefing,
  serializeLoryBriefing
} from "./loryBriefingCache.shared";

const memoryCache = new Map<string, string>();

export async function readCachedLoryBriefing(userId: string, dateKey: string) {
  const key = getLoryBriefingCacheKey(userId, dateKey);
  const cached = memoryCache.get(key);
  if (!cached) return null;

  try {
    const value = parseCachedLoryBriefing(cached);
    return value.dateKey === dateKey ? value : null;
  } catch {
    memoryCache.delete(key);
    return null;
  }
}

export async function writeCachedLoryBriefing(
  userId: string,
  dateKey: string,
  value: CachedLoryBriefing
) {
  memoryCache.set(getLoryBriefingCacheKey(userId, dateKey), serializeLoryBriefing(value));
}

export async function clearCachedLoryBriefing(userId: string, dateKey: string) {
  memoryCache.delete(getLoryBriefingCacheKey(userId, dateKey));
}
