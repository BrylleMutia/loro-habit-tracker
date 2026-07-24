import {
  getLoryBriefingCharacterCount,
  LORY_MAX_DAILY_REFRESHES,
  LORY_MAX_MESSAGE_LENGTH,
  type CachedLoryBriefing
} from "../types/loryBriefing";

const CACHE_PREFIX = "loro.lory.briefing";

export function getLoryBriefingCacheKey(userId: string, dateKey: string) {
  return `${CACHE_PREFIX}.${userId}.${dateKey}`;
}

export function parseCachedLoryBriefing(value: string): CachedLoryBriefing {
  const parsed: unknown = JSON.parse(value);
  const record =
    typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  if (
    !record ||
    typeof record.dateKey !== "string" ||
    typeof record.message !== "string" ||
    record.message.trim().length === 0 ||
    getLoryBriefingCharacterCount(record.message) > LORY_MAX_MESSAGE_LENGTH ||
    typeof record.promptVersion !== "string" ||
    typeof record.contextVersion !== "string" ||
    typeof record.generatedAt !== "string" ||
    typeof record.refreshCount !== "number" ||
    !Number.isInteger(record.refreshCount) ||
    record.refreshCount < 0 ||
    record.refreshCount > LORY_MAX_DAILY_REFRESHES
  ) {
    throw new Error("Invalid Lory briefing cache.");
  }

  return {
    dateKey: record.dateKey,
    message: record.message.trim(),
    promptVersion: record.promptVersion,
    contextVersion: record.contextVersion,
    generatedAt: record.generatedAt,
    refreshCount: record.refreshCount
  };
}

export function serializeLoryBriefing(value: CachedLoryBriefing) {
  return JSON.stringify(value);
}
