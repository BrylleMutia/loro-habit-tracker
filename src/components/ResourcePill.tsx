import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { IconName } from "../constants/home";

type ResourcePillProps = {
  icon: IconName;
  value: string;
  color: string;
  suffix?: string;
};

export function ResourcePill({ icon, value, color, suffix }: ResourcePillProps) {
  return (
    <View className="ml-2 h-9 flex-row items-center rounded-lg border border-[#E6EDF2] bg-[#FFFDF7] px-3">
      <Ionicons name={icon} size={16} color={color} />
      <Text className="ml-1 text-sm font-black text-[#0B2551]">{value}</Text>
      {suffix ? <Text className="ml-1 text-xs font-bold text-[#56A6F7]">{suffix}</Text> : null}
    </View>
  );
}
