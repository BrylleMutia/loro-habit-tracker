import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { userStats } from "../constants/home";
import { PixelParrot } from "./PixelParrot";
import { ResourcePill } from "./ResourcePill";

export function ResourceBar() {
  return (
    <View className="flex-row items-center justify-between">
      <PixelParrot size="sm" />
      <View className="flex-row items-center">
        <ResourcePill icon="heart" value={userStats.hearts.toString()} color={colors.red} suffix="Full" />
        <ResourcePill icon="ellipse" value={userStats.coins} color={colors.gold} />
        <TouchableOpacity
          className="ml-2 h-9 w-9 items-center justify-center rounded-lg bg-[#E7F4FF]"
          activeOpacity={0.82}
        >
          <Ionicons name="add" size={19} color={colors.blueDark} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
