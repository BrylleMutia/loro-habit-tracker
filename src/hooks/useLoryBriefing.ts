import { useCallback, useEffect, useRef, useState } from "react";

import {
  useAuth
} from "../contexts/authContext";
import { useGameBriefing, useGameHabits, useGameSync } from "../contexts/appContext";
import {
  LORY_CONTEXT_VERSION,
  LORY_MAX_DAILY_REFRESHES,
  LORY_PROMPT_VERSION,
  type CachedLoryBriefing
} from "../types/loryBriefing";
import { readCachedLoryBriefing, writeCachedLoryBriefing } from "../services/loryBriefingCache";
import { requestLoryBriefing } from "../services/loryBriefingRepository";

const PENDING_RETRY_LIMIT = 8;
const PENDING_RETRY_DELAY_MS = 1000;

function waitForPendingBriefing() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, PENDING_RETRY_DELAY_MS);
  });
}

async function requestBriefingUntilReady(
  context: Parameters<typeof requestLoryBriefing>[0],
  forceRefresh = false
) {
  let response = await requestLoryBriefing(context, forceRefresh);

  for (let attempt = 0; response?.source === "pending" && attempt < PENDING_RETRY_LIMIT; attempt += 1) {
    await waitForPendingBriefing();
    response = await requestLoryBriefing(context, forceRefresh);
  }

  return response;
}

export function useLoryBriefing() {
  const { activeHabit } = useGameHabits();
  const { briefingContext } = useGameBriefing();
  const { hasHydrated, isOnline, todayDateKey } = useGameSync();
  const { isGuest, session } = useAuth();
  const userId = session?.user.id;
  const fallback = activeHabit.dailyPrompt;
  const [briefing, setBriefing] = useState(fallback);
  const [source, setSource] = useState<"cached" | "generated" | "fallback">("fallback");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const attemptedKeyRef = useRef<string | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);
  const refreshInFlightRef = useRef(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!userId || isGuest || !hasHydrated || !todayDateKey) {
      attemptedKeyRef.current = null;
      inFlightKeyRef.current = null;
      setBriefing(fallback);
      setSource("fallback");
      setIsLoading(false);
      setRefreshCount(0);
      return;
    }

    const requestKey = `${userId}:${todayDateKey}`;
    if (inFlightKeyRef.current === requestKey) {
      if (isMountedRef.current) {
        setBriefing((current) => current || fallback);
        setIsLoading(attemptedKeyRef.current === requestKey);
      }
      return;
    }
    if (attemptedKeyRef.current === requestKey) {
      return;
    }

    inFlightKeyRef.current = requestKey;
    setBriefing(fallback);
    setSource("fallback");
    setIsLoading(false);
    setRefreshCount(0);

    void (async () => {
      try {
        const cached = await readCachedLoryBriefing(userId, todayDateKey);
        if (
          cached &&
          cached.promptVersion === LORY_PROMPT_VERSION &&
          cached.contextVersion === LORY_CONTEXT_VERSION
        ) {
          attemptedKeyRef.current = requestKey;
          if (!isMountedRef.current) return;
          setBriefing(cached.message);
          setSource("cached");
          setRefreshCount(cached.refreshCount);
          return;
        }

        if (!isOnline) return;
        if (attemptedKeyRef.current === requestKey) return;
        attemptedKeyRef.current = requestKey;

        setIsLoading(true);
        const response = await requestBriefingUntilReady(briefingContext);
        if (!response || !isMountedRef.current) return;
        setRefreshCount(response.refreshCount);
        if (response.source === "failed" || !response.message) {
          setBriefing(fallback);
          setSource("fallback");
          return;
        }

        const cachedBriefing: CachedLoryBriefing = {
          dateKey: response.dateKey,
          message: response.message,
          promptVersion: response.promptVersion,
          contextVersion: response.contextVersion,
          generatedAt: response.generatedAt ?? new Date().toISOString(),
          refreshCount: response.refreshCount
        };
        await writeCachedLoryBriefing(userId, todayDateKey, cachedBriefing);
        if (!isMountedRef.current) return;
        setBriefing(response.message);
        setSource(response.source === "cached" || response.source === "limit" ? "cached" : "generated");
      } catch {
        if (isMountedRef.current) {
          setBriefing(fallback);
          setSource("fallback");
        }
      } finally {
        if (inFlightKeyRef.current === requestKey) inFlightKeyRef.current = null;
        if (isMountedRef.current) setIsLoading(false);
      }
    })();
  }, [briefingContext, fallback, hasHydrated, isGuest, isOnline, todayDateKey, userId]);

  const refreshBriefing = useCallback(async () => {
    if (
      !userId ||
      isGuest ||
      !hasHydrated ||
      !todayDateKey ||
      !isOnline ||
      isLoading ||
      refreshCount >= LORY_MAX_DAILY_REFRESHES ||
      refreshInFlightRef.current
    ) {
      return;
    }

    refreshInFlightRef.current = true;
    setIsLoading(true);

    try {
      const response = await requestBriefingUntilReady(briefingContext, true);
      if (!response || !isMountedRef.current) return;

      setRefreshCount(response.refreshCount);
      if (response.source === "failed" || !response.message) {
        setBriefing(fallback);
        setSource("fallback");
        return;
      }

      const cachedBriefing: CachedLoryBriefing = {
        dateKey: response.dateKey,
        message: response.message,
        promptVersion: response.promptVersion,
        contextVersion: response.contextVersion,
        generatedAt: response.generatedAt ?? new Date().toISOString(),
        refreshCount: response.refreshCount
      };
      await writeCachedLoryBriefing(userId, todayDateKey, cachedBriefing);
      if (!isMountedRef.current) return;
      setBriefing(response.message);
      setSource(response.source === "cached" || response.source === "limit" ? "cached" : "generated");
    } catch {
      if (isMountedRef.current) {
        setBriefing(fallback);
        setSource("fallback");
      }
    } finally {
      refreshInFlightRef.current = false;
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [briefingContext, fallback, hasHydrated, isGuest, isLoading, isOnline, refreshCount, todayDateKey, userId]);

  const canRefreshBriefing = Boolean(
    userId &&
      !isGuest &&
      hasHydrated &&
      isOnline &&
      !isLoading &&
      refreshCount < LORY_MAX_DAILY_REFRESHES
  );
  const showRefreshButton = Boolean(userId && !isGuest);

  return {
    briefing,
    canRefreshBriefing,
    isLoading,
    refreshBriefing,
    refreshCount,
    showRefreshButton,
    source
  };
}
