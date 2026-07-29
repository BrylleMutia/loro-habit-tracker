import { useEffect, useState } from "react";
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
import { useGameInventory, useGameProfile, useGameResources } from "../contexts/appContext";
import { shadows } from "../styles/shadows";
import { ResourcePill } from "./ResourcePill";

type ResourceBarProps = {
  onDailyCheckInPress: () => void;
};

const ENERGY_REFILL_INTERVAL_MS = 30 * 60 * 1000; // 1 energy per 30 minutes

export function ResourceBar({ onDailyCheckInPress }: ResourceBarProps) {
  const { dailyStreak } = useGameProfile();
  const { coins, dailyCheckInClaimedToday, energy } = useGameResources();
  const { inventory } = useGameInventory();
  const [nowMs, setNowMs] = useState(Date.now);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  let effectiveCurrent = energy.current;
  let energyValue = `${energy.current}/${energy.max}`;
  let energySuffix: string | undefined;

  if (energy.current < energy.max && energy.lastRefillAt) {
    const elapsed = nowMs - Date.parse(energy.lastRefillAt);
    const pointsGained = Math.floor(elapsed / ENERGY_REFILL_INTERVAL_MS);
    effectiveCurrent = Math.min(energy.max, energy.current + pointsGained);

    if (effectiveCurrent > energy.current) {
      energyValue = `${effectiveCurrent}/${energy.max}`;
    }

    if (effectiveCurrent < energy.max) {
      const remaining =
        ENERGY_REFILL_INTERVAL_MS - (elapsed % ENERGY_REFILL_INTERVAL_MS);
      const minutes = Math.max(1, Math.ceil(remaining / 60_000));
      energySuffix = `+1 in ${minutes}m`;
    }
  }

  return (
    <View
      className="self-center flex-row items-center"
      style={{ maxWidth: "100%" }}
    >
      <View
        className="flex-row items-stretch overflow-hidden rounded-pill border border-line bg-surface-card px-5"
        style={[shadows.card, { flexShrink: 1, minWidth: 0 }]}
      >
        <ResourcePill
          icon="flash"
          value={energyValue}
          color={colors.blueDark}
          suffix={energySuffix}
          tone="energy"
          accessibilityLabel={`Energy ${energyValue}${energySuffix ? `, ${energySuffix}` : ""}`}
        />
        <ResourceDivider />
        <ResourcePill
          icon="flame"
          value={dailyStreak.toString()}
          color={colors.red}
          tone="streak"
          accessibilityLabel={`${dailyStreak} day streak`}
        />
        <ResourceDivider />
        <ResourcePill
          icon="shield-checkmark"
          value={inventory.streakShields.toString()}
          color={colors.green}
          tone="shield"
          accessibilityLabel={`${inventory.streakShields} streak shields`}
        />
        <ResourceDivider />
        <ResourcePill
          icon="ellipse"
          value={coins.toLocaleString("en-US")}
          color={colors.gold}
          tone="coins"
          accessibilityLabel={`${coins.toLocaleString("en-US")} coins`}
        />
      </View>
      <TouchableOpacity
        className={`ml-2 h-11 w-11 shrink-0 items-center justify-center rounded-pill border ${
          dailyCheckInClaimedToday
            ? "border-line-success bg-success-pale"
            : "border-line bg-surface-card"
        }`}
        style={shadows.card}
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
  );
}

function ResourceDivider() {
  return <View className="my-2.5 w-px bg-line" />;
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
