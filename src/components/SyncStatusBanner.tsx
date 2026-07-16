import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../constants/colors";
import { useAppState } from "../contexts/appContext";

export function SyncStatusBanner() {
  const {
    clearSyncError,
    isOnline,
    refreshGameState,
    syncError,
    syncStatus
  } = useAppState();

  if (syncStatus === "ready" || syncStatus === "loading") return null;

  if (syncStatus === "refreshing" && !syncError) {
    return (
      <View className="flex-row items-center justify-center border-b border-line-blue bg-primary-soft px-4 py-2">
        <ActivityIndicator size="small" color={colors.blueDark} />
        <Text className="ml-2 text-xs font-bold text-content-blue-muted">Syncing trail progress…</Text>
      </View>
    );
  }

  const offline = !isOnline || syncStatus === "offline";
  return (
    <View
      className={`flex-row items-center border-b px-4 py-2 ${
        offline ? "border-line-reward bg-reward-soft" : "border-line-red bg-surface-red"
      }`}
      accessibilityRole="alert"
    >
      <Ionicons
        name={offline ? "cloud-offline-outline" : "alert-circle-outline"}
        size={18}
        color={offline ? colors.gold : colors.red}
      />
      <Text className="ml-2 flex-1 text-xs font-semibold leading-4 text-content">
        {syncError?.message ??
          (offline
            ? "Offline viewing is on. Reconnect to complete or claim quests."
            : "Trail progress could not sync.")}
      </Text>
      {isOnline ? (
        <TouchableOpacity
          className="ml-2 px-2 py-1"
          accessibilityLabel="Retry trail sync"
          accessibilityRole="button"
          onPress={() => void refreshGameState()}
        >
          <Text className="text-xs font-black text-primary-strong">Retry</Text>
        </TouchableOpacity>
      ) : null}
      {syncError ? (
        <TouchableOpacity
          className="h-8 w-8 items-center justify-center"
          accessibilityLabel="Dismiss sync message"
          accessibilityRole="button"
          onPress={clearSyncError}
        >
          <Ionicons name="close" size={17} color={colors.grayIcon} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
