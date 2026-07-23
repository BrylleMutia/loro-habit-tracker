import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { GuildScreen } from "../screens/guild";
import { QuestCelebrationModal } from "../components/QuestCelebrationModal";
import { SyncStatusBanner } from "../components/SyncStatusBanner";
import { colors } from "../constants/colors";
import { defaultTabId } from "../constants/home";
import {
  useGameActions,
  useGameResources,
  useGameSync
} from "../contexts/appContext";
import { HomeScreen } from "../screens/home";
import { MoreScreen } from "../screens/more";
import { ProfileScreen } from "../screens/profile";
import { StashScreen } from "../screens/stash";
import type { TabId } from "../types/app";
import { PersistentTabHost } from "./PersistentTabHost";

export function AppNavigator() {
  const { dailyCheckIn, dailyCheckInClaimedToday } = useGameResources();
  const { isOnline, mutationInFlight, todayDateKey } = useGameSync();
  const { claimDailyCheckIn } = useGameActions();
  const [isDailyCheckInVisible, setIsDailyCheckInVisible] = useState(false);
  const promptedDateKeyRef = useRef<string | null>(null);

  const trailStampDetails = useMemo(
    () => ({
      actionLabel: "Hold to check in",
      badgeLabel: "Daily check-in",
      coinReward: dailyCheckIn.rewardCoins,
      description: "Lory stamped today's visit and packed fresh supplies for the trail.",
      energyReward: dailyCheckIn.rewardEnergy,
      title: "Welcome back!"
    }),
    [dailyCheckIn.rewardCoins, dailyCheckIn.rewardEnergy]
  );

  useEffect(() => {
    if (dailyCheckInClaimedToday) {
      setIsDailyCheckInVisible(false);
      return;
    }

    if (promptedDateKeyRef.current !== todayDateKey) {
      promptedDateKeyRef.current = todayDateKey;
      setIsDailyCheckInVisible(true);
    }
  }, [dailyCheckInClaimedToday, todayDateKey]);

  const openDailyCheckIn = useCallback(() => {
    if (!dailyCheckInClaimedToday) setIsDailyCheckInVisible(true);
  }, [dailyCheckInClaimedToday]);

  const claimDailyReward = useCallback(async () => {
    try {
      await claimDailyCheckIn();
      setIsDailyCheckInVisible(false);
    } catch {
      // The modal stays open while the sync banner provides retry guidance.
    }
  }, [claimDailyCheckIn]);

  const renderTabScene = useCallback(
    (tabId: TabId, onNavigateToTab: (nextTab: TabId) => void) => {
      switch (tabId) {
        case "home":
          return <HomeScreen onDailyCheckInPress={openDailyCheckIn} />;
        case "profile":
          return <ProfileScreen onNavigateToTab={onNavigateToTab} />;
        case "stash":
          return <StashScreen onDailyCheckInPress={openDailyCheckIn} />;
        case "more":
          return <MoreScreen onDailyCheckInPress={openDailyCheckIn} />;
        case "guild":
          return <GuildScreen onDailyCheckInPress={openDailyCheckIn} />;
      }
    },
    [openDailyCheckIn]
  );

  return (
    <SafeAreaView className="flex-1 bg-canvas-mint">
      <StatusBar style="dark" />
      <LinearGradient colors={[colors.sky, colors.mint, colors.cream]} className="flex-1">
        <SyncStatusBanner />
        <PersistentTabHost initialTab={defaultTabId} renderScene={renderTabScene} />
      </LinearGradient>
      <QuestCelebrationModal
        variant={isDailyCheckInVisible ? "trail-stamp" : null}
        onClose={() => setIsDailyCheckInVisible(false)}
        onTrailStampAction={claimDailyReward}
        trailStampActionDisabled={!isOnline || mutationInFlight !== null}
        trailStampActionMode="hold"
        trailStampDetails={trailStampDetails}
      />
    </SafeAreaView>
  );
}
