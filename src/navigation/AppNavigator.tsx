import { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

import { BottomTabs } from "../components/BottomTabs";
import { PlaceholderScreen } from "../components/PlaceholderScreen";
import { colors } from "../constants/colors";
import { tabs } from "../constants/home";
import { useAppState } from "../contexts/appContext";
import { HomeScreen } from "../screens/home";
import { MoreScreen } from "../screens/more";

export function AppNavigator() {
  const { activeTab, setActiveTab } = useAppState();
  const activeTabItem = useMemo(
    () => tabs.find((tab) => tab.id === activeTab) ?? tabs[0],
    [activeTab]
  );

  return (
    <SafeAreaView className="flex-1 bg-[#EAF9EF]">
      <StatusBar style="dark" />
      <LinearGradient colors={[colors.sky, colors.mint, colors.cream]} className="flex-1">
        {activeTab === "home" ? <HomeScreen /> : null}
        {activeTab === "more" ? <MoreScreen /> : null}
        {activeTab !== "home" && activeTab !== "more" ? (
          <PlaceholderScreen tab={activeTabItem} />
        ) : null}
        <BottomTabs activeTab={activeTab} onChangeTab={setActiveTab} />
      </LinearGradient>
    </SafeAreaView>
  );
}
