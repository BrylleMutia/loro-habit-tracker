import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { QuestActionButton } from "../components/QuestActionButton";
import { colors } from "../constants/colors";
import { images } from "../constants/images";
import { AppStateProvider, useAppState } from "../contexts/appContext";
import { useAuth } from "../contexts/authContext";
import { AuthScreen } from "../screens/auth";
import { AppNavigator } from "./AppNavigator";

function TrailLoadingScreen() {
  const { hasHydrated, refreshGameState, syncError, syncStatus } = useAppState();

  if (hasHydrated) return <AppNavigator />;

  return (
    <SafeAreaView className="flex-1 bg-canvas-sky">
      <StatusBar style="dark" />
      <LinearGradient
        colors={[colors.sky, colors.mint, colors.cream]}
        className="flex-1 items-center justify-center px-8"
      >
        <Image
          style={{ height: 112, width: 112 }}
          source={images.parrotMascot}
          resizeMode="contain"
          accessibilityLabel="Lory preparing the trail"
        />
        <Text className="mt-4 text-xl font-black text-content">
          {syncStatus === "error" ? "The trail needs another try" : "Preparing your trail..."}
        </Text>
        {syncError ? (
          <Text className="mt-2 text-center text-sm font-semibold leading-5 text-content-muted">
            {syncError.message}
          </Text>
        ) : syncStatus !== "offline" ? (
          <ActivityIndicator className="mt-4" color={colors.blueDark} />
        ) : null}
        {syncStatus === "error" || syncStatus === "offline" ? (
          <QuestActionButton
            className="mt-5 w-44"
            icon="refresh"
            label="Try again"
            mode="tap"
            onAction={() => void refreshGameState()}
          />
        ) : null}
      </LinearGradient>
    </SafeAreaView>
  );
}

export function RootGate() {
  const { session, status } = useAuth();

  if (status === "booting") {
    return (
      <View className="flex-1 items-center justify-center bg-canvas-sky">
        <ActivityIndicator color={colors.blueDark} />
      </View>
    );
  }

  if (status === "guest") {
    return (
      <AppStateProvider key="local-guest" storageMode="local" userId="local-guest">
        <TrailLoadingScreen />
      </AppStateProvider>
    );
  }

  if (status !== "signedIn" || !session) return <AuthScreen />;

  return (
    <AppStateProvider key={session.user.id} userId={session.user.id}>
      <TrailLoadingScreen />
    </AppStateProvider>
  );
}
