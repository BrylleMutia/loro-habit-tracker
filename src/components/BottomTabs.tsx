import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { tabs } from "../constants/home";
import type { TabId } from "../types/app";

type BottomTabsProps = {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
};

export function BottomTabs({ activeTab, onChangeTab }: BottomTabsProps) {
  return (
    <View className="absolute bottom-0 left-0 right-0 border-t border-line bg-surface-card px-4 pb-3 pt-2">
      <View className="flex-row items-center justify-between">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              className={`h-14 min-w-tab-item items-center justify-center rounded-card ${
                isActive ? "bg-primary-soft" : "bg-transparent"
              }`}
              activeOpacity={0.82}
              accessibilityLabel={`${tab.label} tab`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={() => onChangeTab(tab.id)}
            >
              <Ionicons name={tab.icon} size={21} color={isActive ? colors.blueDark : colors.tabInactive} />
              <Text className={`mt-1 text-micro font-black ${isActive ? "text-primary-strong" : "text-content-subtle"}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
