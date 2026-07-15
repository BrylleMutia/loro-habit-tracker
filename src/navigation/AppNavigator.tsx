import { useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

import { BottomTabs } from "../components/BottomTabs";
import { PlaceholderScreen } from "../components/PlaceholderScreen";
import { QuestCelebrationModal } from "../components/QuestCelebrationModal";
import { colors } from "../constants/colors";
import { tabs } from "../constants/home";
import { useAppState } from "../contexts/appContext";
import { HomeScreen } from "../screens/home";
import { MoreScreen } from "../screens/more";
import { ProfileScreen } from "../screens/profile";

export function AppNavigator() {
  const {
    activeTab,
    claimDailyCheckIn,
    dailyCheckIn,
    dailyCheckInClaimedToday,
    setActiveTab,
    todayDateKey
  } = useAppState();
  const [isDailyCheckInVisible, setIsDailyCheckInVisible] = useState(false);
  const promptedDateKeyRef = useRef<string | null>(null);
  const activeTabItem = useMemo(
    () => tabs.find((tab) => tab.id === activeTab) ?? tabs[0],
    [activeTab]
  );
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

  const openDailyCheckIn = () => {
    if (!dailyCheckInClaimedToday) {
      setIsDailyCheckInVisible(true);
    }
  };

  const claimDailyReward = () => {
    claimDailyCheckIn();
    setIsDailyCheckInVisible(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas-mint">
      <StatusBar style="dark" />
      <LinearGradient colors={[colors.sky, colors.mint, colors.cream]} className="flex-1">
        {activeTab === "home" ? (
          <HomeScreen onDailyCheckInPress={openDailyCheckIn} />
        ) : null}
        {activeTab === "profile" ? <ProfileScreen /> : null}
        {activeTab === "more" ? (
          <MoreScreen onDailyCheckInPress={openDailyCheckIn} />
        ) : null}
        {activeTab !== "home" && activeTab !== "profile" && activeTab !== "more" ? (
          <PlaceholderScreen
            onDailyCheckInPress={openDailyCheckIn}
            tab={activeTabItem}
          />
        ) : null}
        <BottomTabs activeTab={activeTab} onChangeTab={setActiveTab} />
      </LinearGradient>
      <QuestCelebrationModal
        variant={isDailyCheckInVisible ? "trail-stamp" : null}
        onClose={() => setIsDailyCheckInVisible(false)}
        onTrailStampAction={claimDailyReward}
        trailStampActionMode="hold"
        trailStampDetails={trailStampDetails}
      />
    </SafeAreaView>
  );
}
