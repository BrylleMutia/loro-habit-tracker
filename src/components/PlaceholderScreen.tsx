import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { shadows } from "../styles/shadows";
import type { TabItem } from "../types/app";
import { PixelParrot } from "./PixelParrot";
import { ResourceBar } from "./ResourceBar";

type PlaceholderScreenProps = {
  tab: TabItem;
};

export function PlaceholderScreen({ tab }: PlaceholderScreenProps) {
  return (
    <View className="flex-1 px-5 pb-28 pt-4">
      <ResourceBar />
      <View
        className="mt-5 flex-1 items-center justify-center rounded-lg border border-[#E6EDF2] bg-[#FFFDF7] p-6"
        style={shadows.card}
      >
        <PixelParrot size="md" />
        <View className="mt-5 h-14 w-14 items-center justify-center rounded-lg bg-[#E7F4FF]">
          <Ionicons name={tab.icon} size={27} color={colors.blueDark} />
        </View>
        <Text className="mt-5 text-2xl font-black text-[#0B2551]">{tab.label}</Text>
        <Text className="mt-2 text-center text-sm font-semibold leading-6 text-[#6D7890]">
          This page is coming soon. Home is ready for the first habit adventure.
        </Text>
      </View>
    </View>
  );
}
