import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  ReduceMotion
} from "react-native-reanimated";

import { colors } from "../constants/colors";
import { tabs } from "../constants/home";
import type { TabId } from "../types/app";

type BottomTabsProps = {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
};

export function BottomTabs({ activeTab, onChangeTab }: BottomTabsProps) {
  return (
    <View
      className="absolute bottom-0 left-0 right-0 border-t border-line bg-surface-card px-2 pb-4"
      style={{ zIndex: 20, overflow: "visible" }}
    >
      <View className="flex-row items-end">
        {tabs.map((tab) => (
          <AnimatedTabItem
            key={tab.id}
            isActive={activeTab === tab.id}
            onPress={() => onChangeTab(tab.id)}
            tab={tab}
          />
        ))}
      </View>
    </View>
  );
}

function AnimatedTabItem({
  isActive,
  onPress,
  tab
}: {
  isActive: boolean;
  onPress: () => void;
  tab: (typeof tabs)[number];
}) {
  const reduceMotion = useReducedMotion();
  const highlightProgress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      highlightProgress.value = isActive ? 1 : 0;
      return;
    }

    if (isActive) {
      highlightProgress.value = 0;
    }

    highlightProgress.value = withTiming(isActive ? 1 : 0, {
      duration: isActive ? 180 : 120,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System
    });
  }, [highlightProgress, isActive, reduceMotion]);

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlightProgress.value,
    transform: [
      {
        translateY: interpolate(highlightProgress.value, [0, 1], [7, 0])
      },
      { scale: interpolate(highlightProgress.value, [0, 1], [0.97, 1]) }
    ]
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(highlightProgress.value, [0, 1], [0, -20])
      },
      { scale: interpolate(highlightProgress.value, [0, 1], [1, 1.04]) }
    ]
  }));

  return (
    <TouchableOpacity
      className="relative min-w-0 flex-1 items-center justify-end rounded-card"
      style={{ height: 58 }}
      activeOpacity={0.82}
      accessibilityLabel={`${tab.label} tab`}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: -17,
            width: 60,
            height: 60,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 30,
            borderWidth: 4,
            borderColor: colors.card,
            backgroundColor: colors.blue,
            zIndex: 0
          },
          highlightStyle
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[{ zIndex: 1 }, iconStyle]}
      >
        <Ionicons
          name={tab.icon}
          size={21}
          color={isActive ? colors.card : colors.tabInactive}
        />
      </Animated.View>
      <Text
        className={`mt-1 text-micro font-black ${
          isActive ? "text-primary-strong" : "text-content-subtle"
        }`}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}
