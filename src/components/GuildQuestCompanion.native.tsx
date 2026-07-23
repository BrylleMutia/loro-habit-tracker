import { useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

import { animations } from "../constants/animations";
import { colors } from "../constants/colors";

const COMPANION_SIZE = 104;

function FallbackCompanion() {
  return (
    <View className="h-full w-full items-center justify-center rounded-full bg-surface-blue">
      <Ionicons
        name="shield-checkmark-outline"
        size={52}
        color={colors.blueDark}
      />
    </View>
  );
}

export function GuildQuestCompanion() {
  const [animationFailed, setAnimationFailed] = useState(false);

  return (
    <View
      accessible
      accessibilityLabel="Animated blue guild quest companion with a shield and quest flag"
      style={{ width: COMPANION_SIZE, height: COMPANION_SIZE }}
    >
      {animationFailed ? (
        <FallbackCompanion />
      ) : (
        <LottieView
          autoPlay
          loop
          onAnimationFailure={() => setAnimationFailed(true)}
          resizeMode="contain"
          source={animations.guildQuestCompanion}
          style={{ width: COMPANION_SIZE, height: COMPANION_SIZE }}
        />
      )}
    </View>
  );
}
