import { createContext, useCallback, useContext, useEffect, type PropsWithChildren } from "react";
import { useAudioPlayer } from "expo-audio";

import { sounds } from "../../constants/audio";

type AppAudioContextValue = {
  playShortPressActionSound: () => void;
};

const AppAudioContext = createContext<AppAudioContextValue | undefined>(undefined);

export function AppAudioProvider({ children }: PropsWithChildren) {
  const shortPressActionPlayer = useAudioPlayer(sounds.shortPressButtonAction, {
    keepAudioSessionActive: true
  });

  useEffect(() => {
    shortPressActionPlayer.loop = false;
    shortPressActionPlayer.volume = 0.35;
  }, [shortPressActionPlayer]);

  const playShortPressActionSound = useCallback(() => {
    void shortPressActionPlayer.seekTo(0).catch(() => undefined);
    shortPressActionPlayer.play();
  }, [shortPressActionPlayer]);

  return (
    <AppAudioContext.Provider value={{ playShortPressActionSound }}>
      {children}
    </AppAudioContext.Provider>
  );
}

export function useAppAudio() {
  const context = useContext(AppAudioContext);

  if (!context) {
    throw new Error("useAppAudio must be used within AppAudioProvider");
  }

  return context;
}
