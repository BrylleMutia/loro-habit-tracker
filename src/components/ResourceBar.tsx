import { useEffect } from "react";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";

import { colors } from "../constants/colors";
import { useGameProfile, useGameResources } from "../contexts/appContext";
import { PixelParrot } from "./PixelParrot";
import { ResourcePill } from "./ResourcePill";

type ResourceBarProps = {
  onDailyCheckInPress: () => void;
};

export function ResourceBar({ onDailyCheckInPress }: ResourceBarProps) {
  const { dailyStreak } = useGameProfile();
  const { coins, dailyCheckInClaimedToday, energy } = useGameResources();

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
          onPress={onDailyCheckInPress}
        >
          <DailyCheckInIcon isClaimed={dailyCheckInClaimedToday} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DailyCheckInIcon({ isClaimed }: { isClaimed: boolean }) {
  const nudgeProgress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    cancelAnimation(nudgeProgress);

    if (isClaimed || reduceMotion) {
      nudgeProgress.value = 0;
      return;
    }

    nudgeProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(-1, { duration: 100 }),
        withTiming(0.7, { duration: 100 }),
        withTiming(0, { duration: 140, easing: Easing.inOut(Easing.quad) }),
        withDelay(2600, withTiming(0, { duration: 1 }))
      ),
      -1,
      false
    );

    return () => cancelAnimation(nudgeProgress);
  }, [isClaimed, nudgeProgress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -Math.abs(nudgeProgress.value) * 2 },
      { rotate: `${nudgeProgress.value * 9}deg` },
      { scale: 1 + Math.abs(nudgeProgress.value) * 0.12 }
    ]
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name={isClaimed ? "checkmark" : "gift-outline"}
        size={19}
        color={isClaimed ? colors.green : colors.blueDark}
      />
    </Animated.View>
  );
}
