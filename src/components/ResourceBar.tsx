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
import {
  getEffectiveEnergyCurrent,
  getEnergyRefillMinutesRemaining
} from "../utility/energy";
import { ResourcePill } from "./ResourcePill";

type ResourceBarProps = {
  onDailyCheckInPress: () => void;
};

export function ResourceBar({ onDailyCheckInPress }: ResourceBarProps) {
  const { dailyStreak } = useGameProfile();
  const { coins, dailyCheckInClaimedToday, energy } = useGameResources();
  const { inventory } = useGameInventory();
  const [nowMs, setNowMs] = useState(Date.now);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const effectiveCurrent = getEffectiveEnergyCurrent(energy, nowMs);
  let energyValue = `${energy.current}/${energy.max}`;
  let energySuffix: string | undefined;

  if (effectiveCurrent > energy.current) {
    energyValue = `${effectiveCurrent}/${energy.max}`;
  }

  const refillMinutes = getEnergyRefillMinutesRemaining(energy, nowMs);
  if (refillMinutes !== null) {
    energySuffix = `+1 in ${refillMinutes}m`;
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
