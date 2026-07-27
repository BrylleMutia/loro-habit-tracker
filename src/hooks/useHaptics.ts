import { useCallback, useRef } from "react";
import * as Haptics from "expo-haptics";

import { useGameSettings } from "../contexts/appContext";

type HapticFunction = () => void;

type HapticsAPI = {
  selection: HapticFunction;
  light: HapticFunction;
  medium: HapticFunction;
  heavy: HapticFunction;
};

export function useHaptics(): HapticsAPI {
  const { settings } = useGameSettings();
  const enabledRef = useRef(settings.hapticsEnabled);
  enabledRef.current = settings.hapticsEnabled;

  const selection = useCallback(() => {
    if (!enabledRef.current) return;
    void Haptics.selectionAsync().catch(() => undefined);
  }, []);

  const light = useCallback(() => {
    if (!enabledRef.current) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, []);

  const medium = useCallback(() => {
    if (!enabledRef.current) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  }, []);

  const heavy = useCallback(() => {
    if (!enabledRef.current) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
  }, []);

  return { selection, light, medium, heavy } as const;
}
