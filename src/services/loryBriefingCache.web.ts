import type { CachedLoryBriefing } from "../types/loryBriefing";
import {
  getLoryBriefingCacheKey,
  parseCachedLoryBriefing,
  serializeLoryBriefing
} from "./loryBriefingCache.shared";

export async function readCachedLoryBriefing(userId: string, dateKey: string) {
  const key = getLoryBriefingCacheKey(userId, dateKey);
  const cached = globalThis.localStorage?.getItem(key);
  if (!cached) return null;

  try {
    const value = parseCachedLoryBriefing(cached);
    return value.dateKey === dateKey ? value : null;
  } catch {
    globalThis.localStorage?.removeItem(key);
    return null;
  }
}

export async function writeCachedLoryBriefing(
  userId: string,
  dateKey: string,
  value: CachedLoryBriefing
) {
  globalThis.localStorage?.setItem(
    getLoryBriefingCacheKey(userId, dateKey),
    serializeLoryBriefing(value)
  );
}

export async function clearCachedLoryBriefing(userId: string, dateKey: string) {
  globalThis.localStorage?.removeItem(getLoryBriefingCacheKey(userId, dateKey));
}
