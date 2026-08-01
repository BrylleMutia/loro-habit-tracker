import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  BounceIn,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useReducedMotion
} from "react-native-reanimated";

import { colors } from "../constants/colors";
import { shadows } from "../styles/shadows";
import type { IconName } from "../types/app";
import { QuestActionButton } from "./QuestActionButton";

export type NewUnlockReward = {
  backgroundClass?: string;
  color: string;
  icon: IconName;
  label: string;
};

export type NewUnlockDetails = {
  accentBackgroundClass: string;
  accentBorderClass: string;
  accentColor: string;
  accentTextClass: string;
  description: string;
  eyebrow: string;
  icon: IconName;
  rewards: NewUnlockReward[];
  title: string;
  actionLabel?: string;
};

type NewUnlockCelebrationModalProps = {
  details: NewUnlockDetails | null;
  onClose: () => void;
};

const pixelConfetti = [
  { color: colors.blue, left: "8%", delay: 40 },
  { color: colors.gold, left: "25%", delay: 110 },
  { color: colors.green, left: "47%", delay: 20 },
  { color: colors.red, left: "69%", delay: 150 },
  { color: colors.blueDark, left: "88%", delay: 80 }
] as const;

export function NewUnlockCelebrationModal({
  details,
  onClose
}: NewUnlockCelebrationModalProps) {
  const reduceMotion = useReducedMotion();

  if (!details) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      statusBarTranslucent
      transparent
      visible
      onRequestClose={onClose}
    >
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.duration(180)}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.overlay,
          paddingHorizontal: 20,
          paddingVertical: 32
        }}
        accessibilityViewIsModal
      >
        <Pressable
          className="absolute inset-0"
          accessibilityLabel="Close new unlock celebration"
          accessibilityRole="button"
          onPress={onClose}
        />
        <View style={{ width: "100%", maxWidth: 360 }}>
          <View
            className="overflow-hidden rounded-card border border-line bg-surface-card"
            style={shadows.card}
          >
            <View className="relative items-center bg-canvas-mint px-5 pb-5 pt-6">
              {pixelConfetti.map((pixel) => (
                <Animated.View
                  key={pixel.left}
                  entering={
                    reduceMotion
                      ? undefined
                      : FadeInDown.delay(pixel.delay).duration(260).springify()
                  }
                  style={{
                    position: "absolute",
                    top: 16,
                    left: pixel.left,
                    width: 12,
                    height: 12,
                    backgroundColor: pixel.color
                  }}
                />
              ))}
              <CloseButton onPress={onClose} />
              <Animated.View
                entering={reduceMotion ? undefined : BounceIn.delay(80).duration(360)}
              >
                <View
                  className={`h-16 w-16 items-center justify-center rounded-pill border-4 ${details.accentBackgroundClass} ${details.accentBorderClass}`}
                >
                  <Ionicons name={details.icon} size={32} color={details.accentColor} />
                </View>
              </Animated.View>
            </View>

            <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(140).duration(240)}>
              <View className="items-center px-5 py-5">
                <Text className={`text-xs font-extrabold uppercase ${details.accentTextClass}`}>
                  {details.eyebrow}
                </Text>
                <Text className="mt-1 text-center text-2xl font-black text-content">
                  {details.title}
                </Text>
                <Text className="mt-2 text-center text-sm font-semibold leading-5 text-content-muted">
                  {details.description}
                </Text>

                <View className="text-center mt-4 w-full border-y border-line py-2">
                  {details.rewards.map((reward, index) => (
                    <Animated.View
                      key={reward.label}
                      entering={
                        reduceMotion
                          ? undefined
                          : FadeInUp.delay(180 + index * 70).duration(220)
                      }
                    >
                      <View className="h-10 flex-row items-center justify-center">
                        <View
                          className={`h-8 w-8 items-center justify-center rounded-card ${reward.backgroundClass ?? "bg-surface-muted"}`}
                        >
                          <Ionicons name={reward.icon} size={17} color={reward.color} />
                        </View>
                        <Text className="ml-3 shrink text-center text-md font-black text-content">
                          {reward.label}
                        </Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>

                <QuestActionButton
                  className="mt-5 w-full"
                  completedLabel="Continuing"
                  icon="arrow-forward"
                  label={details.actionLabel ?? "Continue"}
                  mode="tap"
                  onAction={onClose}
                />
              </View>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      className="absolute right-3 top-3 z-10 h-9 w-9 items-center justify-center rounded-pill bg-white"
      activeOpacity={0.82}
      accessibilityLabel="Close new unlock celebration"
      accessibilityRole="button"
      onPress={onPress}
    >
      <Ionicons name="close" size={19} color={colors.ink} />
    </TouchableOpacity>
  );
}
