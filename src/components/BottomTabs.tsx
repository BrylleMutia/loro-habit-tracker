import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { tabs, type TabId } from "../constants/home";

type BottomTabsProps = {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
};

export function BottomTabs({ activeTab, onChangeTab }: BottomTabsProps) {
  return (
    <View className="absolute bottom-0 left-0 right-0 border-t border-[#E6EDF2] bg-[#FFFDF7] px-4 pb-3 pt-2">
      <View className="flex-row items-center justify-between">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              className={`h-14 min-w-[58px] items-center justify-center rounded-lg ${
                isActive ? "bg-[#E7F4FF]" : "bg-transparent"
              }`}
              activeOpacity={0.82}
              onPress={() => onChangeTab(tab.id)}
            >
              <Ionicons name={tab.icon} size={21} color={isActive ? colors.blueDark : colors.tabInactive} />
              <Text className={`mt-1 text-[10px] font-black ${isActive ? "text-[#2F80ED]" : "text-[#7E899B]"}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
