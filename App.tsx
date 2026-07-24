import "react-native-gesture-handler";
import "./global.css";

import { useEffect } from "react";
import { setAudioModeAsync } from "expo-audio";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/contexts/authContext";
import { AppAudioProvider } from "./src/contexts/audioContext";
import { RootGate } from "./src/navigation/RootGate";

export default function App() {
  useEffect(() => {
    void setAudioModeAsync({
      interruptionMode: "mixWithOthers",
      playsInSilentMode: true
    }).catch(() => undefined);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppAudioProvider>
          <AuthProvider>
            <RootGate />
          </AuthProvider>
        </AppAudioProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
