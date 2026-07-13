import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { useAppState } from "../contexts/appContext";
import { PixelParrot } from "./PixelParrot";
import { ResourcePill } from "./ResourcePill";

export function ResourceBar() {
  const { coins, dailyStreak, energy } = useAppState();

  return (
    <View className="flex-row items-center justify-between">
      <PixelParrot size="sm" />
      <View className="flex-row items-center">
        <ResourcePill icon="flash" value={`${energy.current}/${energy.max}`} color={colors.blueDark} />
        <ResourcePill icon="flame" value={dailyStreak.toString()} color={colors.red} />
        <ResourcePill icon="ellipse" value={coins.toLocaleString("en-US")} color={colors.gold} />
        <TouchableOpacity
          className="ml-2 h-9 w-9 items-center justify-center rounded-lg bg-[#E7F4FF]"
          activeOpacity={0.82}
          accessibilityLabel="Get more energy"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={19} color={colors.blueDark} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
