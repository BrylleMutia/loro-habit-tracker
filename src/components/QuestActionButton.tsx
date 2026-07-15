import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming
} from "react-native-reanimated";

import { colors } from "../constants/colors";
import type { IconName } from "../types/app";

export type QuestActionMode = "hold" | "tap";

type QuestActionButtonProps = {
  accessibilityLabel?: string;
  className?: string;
  completed?: boolean;
  completedIcon?: IconName;
  completedLabel?: string;
  disabled?: boolean;
  holdDurationMs?: number;
  icon: IconName;
  label: string;
  mode: QuestActionMode;
  onAction: () => void;
  size?: "compact" | "default";
};

const DEFAULT_HOLD_DURATION_MS = 1400;
const COMPLETION_ACTION_DELAY_MS = 220;
const COMPLETION_RESET_DELAY_MS = 1100;

export function QuestActionButton({
  accessibilityLabel,
  className = "",
  completed = false,
  completedIcon = "checkmark-circle",
  completedLabel,
  disabled = false,
  holdDurationMs = DEFAULT_HOLD_DURATION_MS,
  icon,
  label,
  mode,
  onAction,
  size = "default"
}: QuestActionButtonProps) {
  const [hasCompletedInteraction, setHasCompletedInteraction] = useState(false);
  const [isIncompleteHold, setIsIncompleteHold] = useState(false);
  const actionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionRef = useRef(false);
  const progress = useSharedValue(0);
  const pressDepth = useSharedValue(0);
  const completionPulse = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const isComplete = completed || hasCompletedInteraction;

  useEffect(
    () => () => {
      if (actionTimerRef.current) {
        clearTimeout(actionTimerRef.current);
      }
      if (holdHintTimerRef.current) {
        clearTimeout(holdHintTimerRef.current);
      }
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      cancelAnimation(progress);
      cancelAnimation(pressDepth);
      cancelAnimation(completionPulse);
    },
    [completionPulse, pressDepth, progress]
  );

  const startPress = () => {
    if (disabled || isComplete) {
      return;
    }

    if (actionTimerRef.current) {
      clearTimeout(actionTimerRef.current);
      actionTimerRef.current = null;
    }
    if (holdHintTimerRef.current) {
      clearTimeout(holdHintTimerRef.current);
      holdHintTimerRef.current = null;
    }
    completionRef.current = false;
    setHasCompletedInteraction(false);
    setIsIncompleteHold(false);
    cancelAnimation(progress);
    pressDepth.value = withTiming(1, { duration: 90 });

    if (mode === "hold") {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: holdDurationMs,
        easing: Easing.linear
      });
    }
  };

  const releasePress = () => {
    pressDepth.value = withTiming(0, {
      duration: 140,
      easing: Easing.out(Easing.quad)
    });

    if (mode === "hold" && !completionRef.current) {
      cancelAnimation(progress);
      progress.value = reduceMotion
        ? 0
        : withSequence(
            withTiming(0.18, { duration: 120, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 220, easing: Easing.inOut(Easing.quad) })
          );
      setIsIncompleteHold(true);
      holdHintTimerRef.current = setTimeout(() => {
        holdHintTimerRef.current = null;
        setIsIncompleteHold(false);
      }, 1000);
    }
  };

  const completeInteraction = () => {
    if (disabled || isComplete || completionRef.current) {
      return;
    }

    completionRef.current = true;
    setHasCompletedInteraction(true);
    setIsIncompleteHold(false);
    completionPulse.value = reduceMotion
      ? 0
      : withSequence(
          withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 260, easing: Easing.inOut(Easing.quad) })
        );

    const invokeAction = () => {
      actionTimerRef.current = null;
      onAction();
    };

    resetTimerRef.current = setTimeout(() => {
      resetTimerRef.current = null;
      setHasCompletedInteraction(false);
      progress.value = withTiming(0, { duration: reduceMotion ? 0 : 180 });
    }, COMPLETION_RESET_DELAY_MS);

    if (reduceMotion) {
      invokeAction();
    } else {
      actionTimerRef.current = setTimeout(invokeAction, COMPLETION_ACTION_DELAY_MS);
    }
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: pressDepth.value * 3 - completionPulse.value * 4 },
      { scale: 1 + completionPulse.value * 0.025 }
    ]
  }));
  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`
  }));
  const isInteractionDisabled = disabled || isComplete;
  const displayLabel = isComplete
    ? completedLabel ?? label
    : isIncompleteHold
      ? "Keep holding"
      : label;

  return (
    <View
      className={`${className} rounded-card pb-1 ${
        disabled && !isComplete ? "bg-line-muted" : "bg-primary-strong"
      }`}
    >
      <Animated.View style={buttonStyle}>
        <Pressable
          className={`relative w-full flex-row items-center justify-center overflow-hidden rounded-card ${
            size === "compact" ? "h-10" : "h-12"
          } ${disabled && !isComplete ? "bg-line-disabled" : "bg-primary"}`}
          accessibilityHint={
            disabled
              ? undefined
              : mode === "hold"
                ? "Press and hold until the progress indicator is full"
                : "Tap once to activate"
          }
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityRole="button"
          accessibilityState={{ disabled: isInteractionDisabled }}
          delayLongPress={mode === "hold" ? holdDurationMs : undefined}
          disabled={isInteractionDisabled}
          onLongPress={mode === "hold" ? completeInteraction : undefined}
          onPress={mode === "tap" ? completeInteraction : undefined}
          onPressIn={startPress}
          onPressOut={releasePress}
        >
          {mode === "hold" ? (
            <Animated.View
              className="absolute bottom-0 left-0 top-0 bg-primary-strong"
              style={fillStyle}
            />
          ) : null}
          <View
            className={`z-10 w-full items-center justify-center ${
              size === "compact" ? "px-10" : "px-12"
            }`}
          >
            <View className={`absolute ${size === "compact" ? "left-3" : "left-4"}`}>
              <Ionicons
                name={isComplete ? completedIcon : icon}
                size={size === "compact" ? 16 : 19}
                color={disabled && !isComplete ? colors.grayIcon : "white"}
              />
            </View>
            <Text
              className={`w-full text-center font-black ${
                size === "compact" ? "text-xs" : "text-sm"
              } ${disabled && !isComplete ? "text-content-subtle" : "text-white"}`}
              numberOfLines={1}
            >
              {displayLabel}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
