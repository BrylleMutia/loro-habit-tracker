import { useEffect, useState } from "react";

const DEFAULT_DEFER_DELAY_MS = 300;

export function useDeferredMount(delayMs = DEFAULT_DEFER_DELAY_MS) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsReady(true), delayMs);
    return () => clearTimeout(timeout);
  }, [delayMs]);

  return isReady;
}
