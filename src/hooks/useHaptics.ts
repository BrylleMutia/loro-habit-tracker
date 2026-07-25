import { useCallback, useRef } from "react";
import * as Haptics from "expo-haptics";

import { useGameSettings } from "../contexts/appContext";

type HapticFunction = () => void;

type HapticsAPI = {
  light: HapticFunction;
  medium: HapticFunction;
  heavy: HapticFunction;
};

export function useHaptics(): HapticsAPI {
  const { settings } = useGameSettings();
  const enabledRef = useRef(settings.hapticsEnabled);
  enabledRef.current = settings.hapticsEnabled;

  const light = useCallback(() => {
    if (!enabledRef.current) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const medium = useCallback(() => {
    if (!enabledRef.current) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const heavy = useCallback(() => {
    if (!enabledRef.current) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  return { light, medium, heavy } as const;
}
