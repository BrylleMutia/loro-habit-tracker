import type { GameResponse, SnapshotOutcome } from "../types/backend";
import { parseGameResponse } from "./gameRepository";

const CACHE_PREFIX = "loro.game.snapshot";

export function getGameCacheKey(userId: string) {
  return `${CACHE_PREFIX}.${userId}`;
}

export function parseCachedGameState(cached: string) {
  return parseGameResponse(JSON.parse(cached)) as GameResponse<SnapshotOutcome>;
}

export function serializeGameState(response: GameResponse) {
  const snapshotResponse: GameResponse<SnapshotOutcome> = {
    ...response,
    outcome: { kind: "snapshot" }
  };
  return JSON.stringify(snapshotResponse);
}
