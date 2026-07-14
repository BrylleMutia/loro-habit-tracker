import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { useAppState } from "../contexts/appContext";
import { PixelParrot } from "./PixelParrot";
import { ResourcePill } from "./ResourcePill";

export function ResourceBar() {
  const {
    claimDailyCheckIn,
    coins,
    dailyCheckInClaimedToday,
    dailyStreak,
    energy
  } = useAppState();

  return (
    <View className="flex-row items-center justify-between">
      <PixelParrot size="sm" />
      <View className="flex-row items-center">
        <ResourcePill icon="flash" value={`${energy.current}/${energy.max}`} color={colors.blueDark} />
        <ResourcePill icon="flame" value={dailyStreak.toString()} color={colors.red} />
        <ResourcePill icon="ellipse" value={coins.toLocaleString("en-US")} color={colors.gold} />
        <TouchableOpacity
          className={`ml-2 h-9 w-9 items-center justify-center rounded-card ${
            dailyCheckInClaimedToday ? "bg-success-pale" : "bg-primary-soft"
          }`}
          activeOpacity={0.82}
          accessibilityLabel={dailyCheckInClaimedToday ? "Daily reward claimed" : "Claim daily reward"}
          accessibilityRole="button"
          accessibilityState={{ disabled: dailyCheckInClaimedToday }}
          disabled={dailyCheckInClaimedToday}
          onPress={claimDailyCheckIn}
        >
          <Ionicons
            name={dailyCheckInClaimedToday ? "checkmark" : "gift-outline"}
            size={19}
            color={dailyCheckInClaimedToday ? colors.green : colors.blueDark}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
