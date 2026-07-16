import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
          {syncStatus === "error" ? "The trail needs another try" : "Preparing your trail…"}
        </Text>
        {syncError ? (
          <Text className="mt-2 text-center text-sm font-semibold leading-5 text-content-muted">
            {syncError.message}
          </Text>
        ) : syncStatus !== "offline" ? (
          <ActivityIndicator className="mt-4" color={colors.blueDark} />
        ) : null}
        {syncStatus === "error" || syncStatus === "offline" ? (
          <TouchableOpacity
            className="mt-5 h-12 flex-row items-center rounded-card bg-primary px-5"
            accessibilityRole="button"
            onPress={() => void refreshGameState()}
          >
            <Ionicons name="refresh" size={18} color={colors.card} />
            <Text className="ml-2 font-black text-white">Try again</Text>
          </TouchableOpacity>
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

  if (status !== "signedIn" || !session) return <AuthScreen />;

  return (
    <AppStateProvider key={session.user.id} userId={session.user.id}>
      <TrailLoadingScreen />
    </AppStateProvider>
  );
}
