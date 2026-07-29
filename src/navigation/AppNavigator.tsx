import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { GuildScreen } from "../screens/guild";
import {
  NewUnlockCelebrationModal,
  type NewUnlockDetails
} from "../components/NewUnlockCelebrationModal";
import { QuestCelebrationModal } from "../components/QuestCelebrationModal";
import { SyncStatusBanner } from "../components/SyncStatusBanner";
import { colors } from "../constants/colors";
import { defaultTabId } from "../constants/home";
import {
  useGameActions,
  useGameProfile,
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
  return <AppNavigatorContent />;
}

function AppNavigatorContent() {
  const { profile } = useGameProfile();
  const { dailyCheckIn, dailyCheckInClaimedToday } = useGameResources();
  const { hasHydrated, isOnline, mutationInFlight, todayDateKey } = useGameSync();
  const { claimDailyCheckIn } = useGameActions();
  const [isDailyCheckInVisible, setIsDailyCheckInVisible] = useState(false);
  const [isHomeLootVisible, setIsHomeLootVisible] = useState(false);
  const [moreExpandHabitTargets, setMoreExpandHabitTargets] = useState(false);
  const [unlockQueue, setUnlockQueue] = useState<NewUnlockDetails[]>([]);
  const promptedDateKeyRef = useRef<string | null>(null);
  const previousProfileLevelRef = useRef<number | null>(null);

  const enqueueNewUnlock = useCallback((details: NewUnlockDetails) => {
    setUnlockQueue((current) => [...current, details]);
  }, []);

  const dismissNewUnlock = useCallback(() => {
    setUnlockQueue((current) => current.slice(1));
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      previousProfileLevelRef.current = null;
      return;
    }

    const previousLevel = previousProfileLevelRef.current;
    previousProfileLevelRef.current = profile.level;
    if (previousLevel === null || profile.level <= previousLevel) return;

    enqueueNewUnlock({
      accentBackgroundClass: "bg-primary-soft",
      accentBorderClass: "border-line-primary",
      accentColor: colors.blueDark,
      accentTextClass: "text-primary-strong",
      description: "Your trail captain rank is growing stronger. Keep exploring and completing quests.",
      eyebrow: "Level up",
      icon: "sparkles",
      rewards: [
        {
          backgroundClass: "bg-primary-soft",
          color: colors.blueDark,
          icon: "arrow-up-circle",
          label: `Level ${profile.level}`
        }
      ],
      title: "New level reached!"
    });
  }, [enqueueNewUnlock, hasHydrated, profile.level]);

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
          return (
            <HomeScreen
              onDailyCheckInPress={openDailyCheckIn}
              onLootVisibilityChange={setIsHomeLootVisible}
              onNavigateToMoreSettings={() => {
                setMoreExpandHabitTargets(true);
                onNavigateToTab("more");
              }}
              onNavigateToTab={onNavigateToTab}
              onNewUnlock={enqueueNewUnlock}
            />
          );
        case "profile":
          return <ProfileScreen onNavigateToTab={onNavigateToTab} />;
        case "stash":
          return <StashScreen onDailyCheckInPress={openDailyCheckIn} />;
        case "more":
          return (
            <MoreScreen
              expandHabitTargets={moreExpandHabitTargets}
              onDailyCheckInPress={openDailyCheckIn}
              onHabitTargetsToggled={() => setMoreExpandHabitTargets(false)}
            />
          );
        case "guild":
          return <GuildScreen onDailyCheckInPress={openDailyCheckIn} />;
      }
    },
    [enqueueNewUnlock, openDailyCheckIn, moreExpandHabitTargets]
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
      <NewUnlockCelebrationModal
        details={isDailyCheckInVisible || isHomeLootVisible ? null : unlockQueue[0] ?? null}
        onClose={dismissNewUnlock}
      />
    </SafeAreaView>
  );
}
