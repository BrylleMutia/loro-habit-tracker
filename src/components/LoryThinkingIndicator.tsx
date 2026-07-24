import { useEffect } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";

import { colors } from "../constants/colors";

export function LoryThinkingIndicator() {
  const pulse = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    cancelAnimation(pulse);

    if (reduceMotion) {
      pulse.value = 0;
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 520, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    return () => cancelAnimation(pulse);
  }, [pulse, reduceMotion]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.45,
    transform: [
      { translateY: -pulse.value * 2 },
      { scale: 1 + pulse.value * 0.08 }
    ]
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.65,
    transform: [{ translateY: -pulse.value }]
  }));

  return (
    <View
      accessible
      accessibilityLabel="Lory is thinking"
      className="flex-row items-center"
    >
      <Animated.View style={iconStyle}>
        <Ionicons name="sparkles" size={14} color={colors.blueDark} />
      </Animated.View>
      <Text className="ml-1 text-sm font-semibold leading-5 text-content-muted">
        Lory is thinking
      </Text>
      <Animated.Text
        className="ml-1 text-base font-black leading-5 text-content-muted"
        style={dotsStyle}
      >
        ...
      </Animated.Text>
    </View>
  );
}
