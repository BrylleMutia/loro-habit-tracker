import { Fragment } from "react";
import { useEffect } from "react";
import { Text, View } from "react-native";
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
import { useGameHabits } from "../contexts/appContext";
import { shadows } from "../styles/shadows";
import type { AdventureNodeStatus } from "../types/app";
import { isSectionComplete } from "../utility/adventurePath";
import { QuestActionButton } from "./QuestActionButton";

type AdventurePathPreviewProps = {
  onViewPath: () => void;
};

export function AdventurePathPreview({ onViewPath }: AdventurePathPreviewProps) {
  const { activeAdventure, activeHabit } = useGameHabits();
  const section = activeAdventure.focusLocation?.section;
  const hasClaimableChapterReward = activeHabit.sections.some(
    (candidate) =>
      isSectionComplete(activeHabit, candidate.id) &&
      !activeHabit.claimedChapterRewardIds.includes(candidate.id)
  );

  if (!section) {
    return null;
  }

  return (
    <View className="mt-4 rounded-card border border-line bg-surface-card p-4" style={shadows.card}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-extrabold uppercase text-content-muted">Adventure Map</Text>
          <Text className="mt-1 text-lg font-black text-content">{section.title}</Text>
        </View>
        <View className="relative w-40">
          <QuestActionButton
            accessibilityLabel={
              hasClaimableChapterReward
                ? "View full adventure path, chapter reward ready to claim"
                : "View full adventure path"
            }
            className="w-full"
            completedLabel="Opening path"
            icon="map-outline"
            label="Open map"
            mode="tap"
            onAction={onViewPath}
            size="compact"
          />
          {hasClaimableChapterReward ? <ClaimableRewardBadge /> : null}
        </View>
      </View>

      <View className="mt-4 rounded-card border border-line-primary bg-surface-blue p-3">
        <View className="flex-row items-start">
          {activeAdventure.previewNodes.map((preview, index) => (
            <Fragment key={preview.node.id}>
              <PreviewNode
                day={preview.node.day}
                title={preview.node.title}
                status={preview.status}
              />
              {index < activeAdventure.previewNodes.length - 1 ? (
                <View
                  className={`mt-5 h-path-line flex-1 ${
                    preview.status === "done" ? "bg-success" : "bg-line-disabled"
                  }`}
                />
              ) : null}
            </Fragment>
          ))}
        </View>
      </View>
    </View>
  );
}

function ClaimableRewardBadge() {
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    cancelAnimation(progress);

    if (reduceMotion) {
      progress.value = 0;
      return;
    }

    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 180, easing: Easing.inOut(Easing.quad) }),
        withDelay(2400, withTiming(0, { duration: 1 }))
      ),
      -1,
      false
    );

    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -Math.abs(progress.value) * 3 },
      { rotate: `${progress.value * 10}deg` },
      { scale: 1 + Math.abs(progress.value) * 0.08 }
    ]
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", right: -7, top: -7 }, animatedStyle]}
    >
      <View className="h-7 w-7 items-center justify-center rounded-pill border border-line-reward bg-reward-soft">
        <Ionicons name="gift" size={16} color={colors.gold} />
      </View>
    </Animated.View>
  );
}

function PreviewNode({
  day,
  title,
  status
}: {
  day: number;
  title: string;
  status: AdventureNodeStatus;
}) {
  const isDone = status === "done";
  const isActive = status === "active";

  return (
    <View className="w-path-node items-center">
      <View
        className={`h-10 w-10 items-center justify-center rounded-pill border-2 ${
          isDone
            ? "border-success bg-success"
            : isActive
              ? "border-primary bg-primary"
              : "border-line-muted bg-surface-muted"
        }`}
      >
        {isDone ? (
          <Ionicons name="checkmark" size={18} color="white" />
        ) : isActive ? (
          <Ionicons name="flag" size={17} color="white" />
        ) : (
          <Ionicons name="lock-closed" size={15} color={colors.grayIcon} />
        )}
      </View>
      <Text className="mt-2 text-micro font-extrabold uppercase text-content-subtle">Day {day}</Text>
      <Text className="mt-1 text-center text-xs font-bold text-content" numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
}
