import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming
} from "react-native-reanimated";

import { QuestActionButton } from "../../components/QuestActionButton";
import { colors } from "../../constants/colors";
import { shadows } from "../../styles/shadows";
import type { IconName } from "../../types/app";

type PrototypeThemeId = "quest-stamp" | "sky-pulse" | "trail-charge";

type PrototypeTheme = {
  id: PrototypeThemeId;
  icon: IconName;
  number: string;
  title: string;
  tone: string;
};

const HOLD_DURATION_MS = 1400;

const prototypeThemes: PrototypeTheme[] = [
  {
    id: "trail-charge",
    icon: "navigate",
    number: "01",
    title: "Trail Charge",
    tone: "Solid fill"
  },
  {
    id: "sky-pulse",
    icon: "radio-button-on",
    number: "02",
    title: "Sky Pulse",
    tone: "Ripple outline"
  },
  {
    id: "quest-stamp",
    icon: "shield-checkmark",
    number: "03",
    title: "Quest Stamp",
    tone: "Arcade depth"
  }
];

export function ActionButtonPrototypes() {
  return (
    <View className="mt-5">
      {prototypeThemes.map((theme) => (
        <View
          key={theme.id}
          className="mb-4 rounded-card border border-line bg-surface-card p-4"
          style={shadows.card}
        >
          <View className="mb-4 flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-card bg-primary-soft">
              <Ionicons name={theme.icon} size={20} color={colors.blueDark} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-micro font-extrabold uppercase text-primary-strong">
                Theme {theme.number} | {theme.tone}
              </Text>
              <Text className="mt-1 text-lg font-black text-content">{theme.title}</Text>
            </View>
          </View>

          <Text className="mb-2 text-micro font-extrabold uppercase text-content-muted">
            Hold action
          </Text>
          {theme.id === "quest-stamp" ? (
            <QuestActionButton
              completedLabel="Quest confirmed"
              icon="shield-checkmark"
              label="Hold to complete"
              mode="hold"
              onAction={() => undefined}
            />
          ) : (
            <LongPressPrototype theme={theme} />
          )}

          <Text className="mb-2 mt-4 text-micro font-extrabold uppercase text-content-muted">
            Tap action
          </Text>
          {theme.id === "quest-stamp" ? (
            <QuestActionButton
              completedLabel="Reward collected"
              icon="gift"
              label="Collect reward"
              mode="tap"
              onAction={() => undefined}
            />
          ) : (
            <ShortPressPrototype theme={theme} />
          )}
        </View>
      ))}
    </View>
  );
}

function LongPressPrototype({ theme }: { theme: PrototypeTheme }) {
  const [isComplete, setIsComplete] = useState(false);
  const isHoldingRef = useRef(false);
  const isCompleteRef = useRef(false);
  const progress = useSharedValue(0);
  const completionPulse = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(
    () => () => {
      cancelAnimation(progress);
      cancelAnimation(completionPulse);
    },
    [completionPulse, progress]
  );

  const completeHold = () => {
    if (!isHoldingRef.current) {
      return;
    }

    isCompleteRef.current = true;
    setIsComplete(true);
    completionPulse.value = reduceMotion
      ? 0
      : withSequence(
          withTiming(1, { duration: 160 }),
          withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) })
        );
  };

  const startHold = () => {
    cancelAnimation(progress);
    isHoldingRef.current = true;
    isCompleteRef.current = false;
    setIsComplete(false);
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: HOLD_DURATION_MS,
      easing: Easing.linear
    });
  };

  const endHold = () => {
    isHoldingRef.current = false;

    if (!isCompleteRef.current) {
      cancelAnimation(progress);
      progress.value = withTiming(0, { duration: 180 });
    }
  };

  const completionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + completionPulse.value * 0.08 }]
  }));

  return (
    <Animated.View style={completionStyle}>
      <Pressable
        className={getLongPressClassName(theme.id)}
        accessibilityHint="Press and hold until the progress indicator is full"
        accessibilityLabel={isComplete ? "Quest confirmed" : "Hold to complete quest"}
        accessibilityRole="button"
        delayLongPress={HOLD_DURATION_MS}
        onLongPress={completeHold}
        onPressIn={startHold}
        onPressOut={endHold}
      >
        <LongPressProgress theme={theme} progress={progress} />
        <View className="z-10 w-full flex-row items-center px-3">
          <Ionicons
            name={isComplete ? "checkmark-circle" : theme.icon}
            size={19}
            color={theme.id === "sky-pulse" ? colors.blueDark : "white"}
          />
          <Text className={getLongPressTextClassName(theme.id)} numberOfLines={1}>
            {isComplete ? "Quest confirmed" : "Complete quest"}
          </Text>
          <InteractionCue isComplete={isComplete} mode="hold" themeId={theme.id} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function LongPressProgress({
  progress,
  theme
}: {
  progress: SharedValue<number>;
  theme: PrototypeTheme;
}) {
  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + progress.value * 0.35,
    transform: [{ scale: 0.72 + progress.value * 0.55 }]
  }));

  if (theme.id === "trail-charge") {
    return (
      <Animated.View
        className="absolute bottom-0 left-0 top-0 bg-primary-strong"
        style={fillStyle}
      />
    );
  }

  if (theme.id === "sky-pulse") {
    return (
      <>
        <Animated.View
          className="absolute h-20 w-20 rounded-pill border-2 border-primary"
          style={pulseStyle}
        />
        <View className="absolute bottom-0 left-3 right-3 h-1 overflow-hidden rounded-pill bg-line-progress">
          <Animated.View className="h-full bg-primary" style={fillStyle} />
        </View>
      </>
    );
  }

  return null;
}

function ShortPressPrototype({ theme }: { theme: PrototypeTheme }) {
  const [isComplete, setIsComplete] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressProgress = useSharedValue(0);
  const successProgress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(
    () => () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      cancelAnimation(pressProgress);
      cancelAnimation(successProgress);
    },
    [pressProgress, successProgress]
  );

  const releasePress = () => {
    pressProgress.value = withTiming(0, { duration: 120 });
  };

  const completeAction = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    setIsComplete(true);
    successProgress.value = 0;
    successProgress.value = reduceMotion
      ? 0
      : withSequence(
          withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 380, easing: Easing.inOut(Easing.quad) })
        );
    resetTimerRef.current = setTimeout(() => setIsComplete(false), 1200);
  };

  const buttonStyle = useAnimatedStyle(() => {
    const successScale = theme.id === "trail-charge" ? successProgress.value * 0.08 : 0;

    return {
      transform: [
        { translateY: pressProgress.value * 3 },
        { scale: 1 - pressProgress.value * 0.035 + successScale }
      ]
    };
  });
  const rippleStyle = useAnimatedStyle(() => ({
    opacity:
      Math.min(successProgress.value * 4, 1) * (1 - successProgress.value) * 0.6,
    transform: [{ scale: 0.3 + successProgress.value * 1.5 }]
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${successProgress.value * 18}deg` },
      { scale: 1 + successProgress.value * 0.22 }
    ]
  }));

  return (
    <Animated.View style={buttonStyle}>
      <Pressable
        className={getShortPressClassName(theme.id)}
        accessibilityLabel={isComplete ? "Reward collected" : "Collect reward"}
        accessibilityRole="button"
        onPress={completeAction}
        onPressIn={() => {
          pressProgress.value = withTiming(1, { duration: 80 });
        }}
        onPressOut={releasePress}
      >
        {theme.id === "sky-pulse" ? (
          <Animated.View
            className="absolute h-24 w-24 rounded-pill border-2 border-primary"
            style={rippleStyle}
          />
        ) : null}
        <View className="z-10 w-full flex-row items-center px-3">
          <Animated.View style={iconStyle}>
            <Ionicons
              name={isComplete ? "checkmark-circle" : "gift"}
              size={19}
              color={theme.id === "sky-pulse" ? colors.blueDark : "white"}
            />
          </Animated.View>
          <Text className={getShortPressTextClassName(theme.id)} numberOfLines={1}>
            {isComplete ? "Reward collected" : "Collect reward"}
          </Text>
          <InteractionCue isComplete={isComplete} mode="tap" themeId={theme.id} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function getLongPressClassName(themeId: PrototypeThemeId) {
  if (themeId === "sky-pulse") {
    return "relative h-12 overflow-hidden rounded-card border-2 border-primary bg-primary-soft flex-row items-center justify-center";
  }

  return "relative h-12 overflow-hidden rounded-card bg-primary flex-row items-center justify-center";
}

function getShortPressClassName(themeId: PrototypeThemeId) {
  if (themeId === "sky-pulse") {
    return "relative h-12 overflow-hidden rounded-card border-2 border-primary bg-surface-blue flex-row items-center justify-center";
  }

  return "relative h-12 overflow-hidden rounded-card bg-primary flex-row items-center justify-center";
}

function getLongPressTextClassName(themeId: PrototypeThemeId) {
  return `ml-2 flex-1 text-center text-sm font-black ${
    themeId === "sky-pulse" ? "text-primary-strong" : "text-white"
  }`;
}

function getShortPressTextClassName(themeId: PrototypeThemeId) {
  return `ml-2 flex-1 text-center text-sm font-black ${
    themeId === "sky-pulse" ? "text-primary-strong" : "text-white"
  }`;
}

function InteractionCue({
  isComplete,
  mode,
  themeId
}: {
  isComplete: boolean;
  mode: "hold" | "tap";
  themeId: PrototypeThemeId;
}) {
  const isOutlineTheme = themeId === "sky-pulse";
  const icon = isComplete
    ? "checkmark"
    : mode === "hold"
      ? "finger-print"
      : "hand-left-outline";
  const color = isComplete
    ? colors.green
    : isOutlineTheme
      ? "white"
      : colors.blueDark;

  return (
    <View
      className={`ml-2 h-7 w-16 flex-row items-center justify-center rounded-card ${
        isComplete
          ? "bg-success-soft"
          : isOutlineTheme
            ? "bg-primary"
            : "bg-primary-soft"
      }`}
    >
      <Ionicons name={icon} size={13} color={color} />
      <Text
        className={`ml-1 text-micro font-black uppercase ${
          isComplete || !isOutlineTheme ? "text-primary-strong" : "text-white"
        }`}
      >
        {isComplete ? "Done" : mode}
      </Text>
    </View>
  );
}
