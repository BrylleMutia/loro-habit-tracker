import { useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  BounceIn,
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp
} from "react-native-reanimated";

import { colors } from "../constants/colors";
import { shadows } from "../styles/shadows";
import { PixelParrot } from "./PixelParrot";

export type CelebrationVariant = "trail-stamp" | "loot-drop" | "power-up";

export type LootDropDetails = {
  coinReward: number;
  xpReward: number;
  streak: number;
  habitLabel: string;
};

type QuestCelebrationModalProps = {
  variant: CelebrationVariant | null;
  onClose: () => void;
  lootDropDetails?: LootDropDetails;
};

const defaultLootDropDetails: LootDropDetails = {
  coinReward: 20,
  xpReward: 32,
  streak: 1,
  habitLabel: "Daily Quest"
};

const pixelConfetti = [
  { color: colors.blue, left: "8%", delay: 40 },
  { color: colors.gold, left: "25%", delay: 110 },
  { color: colors.green, left: "47%", delay: 20 },
  { color: colors.red, left: "69%", delay: 150 },
  { color: colors.blueDark, left: "88%", delay: 80 }
] as const;

export function QuestCelebrationModal({
  variant,
  onClose,
  lootDropDetails = defaultLootDropDetails
}: QuestCelebrationModalProps) {
  if (!variant) {
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
        entering={FadeIn.duration(180)}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(11, 37, 81, 0.42)",
          paddingHorizontal: 20,
          paddingVertical: 32
        }}
        accessibilityViewIsModal
      >
        <Pressable
          className="absolute inset-0"
          accessibilityLabel="Close celebration"
          accessibilityRole="button"
          onPress={onClose}
        />
        {variant === "trail-stamp" ? <TrailStampCelebration onClose={onClose} /> : null}
        {variant === "loot-drop" ? (
          <LootDropCelebration details={lootDropDetails} onClose={onClose} />
        ) : null}
        {variant === "power-up" ? <PowerUpCelebration onClose={onClose} /> : null}
      </Animated.View>
    </Modal>
  );
}

function TrailStampCelebration({ onClose }: { onClose: () => void }) {
  return (
    <View style={{ width: "100%", maxWidth: 360 }}>
      <View
        className="overflow-hidden rounded-lg border border-[#BEE8CA] bg-[#FFFDF7]"
        style={shadows.card}
      >
        <View className="relative items-center bg-[#EAF9EF] px-5 pb-5 pt-6">
          {pixelConfetti.map((pixel) => (
            <Animated.View
              key={pixel.left}
              entering={FadeInDown.delay(pixel.delay).duration(260).springify()}
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
          <Animated.View entering={BounceIn.delay(70).duration(340)}>
            <PixelParrot size="md" mirrorX />
          </Animated.View>
          <Animated.View entering={BounceIn.delay(140).duration(320)}>
            <View className="-mt-2 h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#56C878]">
              <Ionicons name="checkmark" size={30} color="white" />
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(170).duration(240)}>
          <View className="items-center px-5 py-5">
            <Text className="text-xs font-extrabold uppercase text-[#4C8060]">Trail stamp earned</Text>
            <Text className="mt-1 text-center text-2xl font-black text-[#0B2551]">Quest complete!</Text>
            <Text className="mt-2 text-center text-sm font-semibold leading-5 text-[#6D7890]">
              Foundation Circuit is now part of your adventure.
            </Text>
            <RewardRow coinReward={20} xpReward={32} />
            <CelebrationButton
              icon="arrow-forward"
              label="Continue trail"
              color={colors.green}
              onPress={onClose}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function LootDropCelebration({
  details,
  onClose
}: {
  details: LootDropDetails;
  onClose: () => void;
}) {
  const [page, setPage] = useState<"rewards" | "streak">("rewards");
  const rewards = [
    { icon: "ellipse" as const, color: colors.gold, label: `+${details.coinReward} coins` },
    { icon: "sparkles" as const, color: colors.green, label: `+${details.xpReward} XP` }
  ];

  return (
    <View style={{ width: "100%", maxWidth: 380, marginTop: "auto" }}>
      <View
        className="rounded-lg border border-[#FFE2A8] bg-[#FFFDF7] p-5"
        style={shadows.card}
      >
        <CloseButton onPress={onClose} />
        {page === "rewards" ? (
          <Animated.View entering={FadeIn.duration(180)}>
            <View className="flex-row items-center pr-8">
              <Animated.View entering={BounceIn.delay(80).duration(360)}>
                <View className="h-20 w-20 items-center justify-center rounded-lg border border-[#F7D27D] bg-[#FFF3D6]">
                  <Ionicons name="gift" size={42} color={colors.gold} />
                </View>
              </Animated.View>
              <View className="ml-4 flex-1">
                <Text className="text-xs font-extrabold uppercase text-[#A66E08]">Loot drop</Text>
                <Text className="mt-1 text-2xl font-black text-[#0B2551]">Rewards secured</Text>
                <Text className="mt-1 text-sm font-semibold leading-5 text-[#6D7890]">
                  Lory packed your quest haul.
                </Text>
              </View>
            </View>

            <View className="mt-5 border-y border-[#F3E3BC] py-2">
              {rewards.map((reward, index) => (
                <Animated.View
                  key={reward.label}
                  entering={FadeInUp.delay(130 + index * 90).duration(240)}
                >
                  <View className="h-11 flex-row items-center">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-[#FFF7EA]">
                      <Ionicons name={reward.icon} size={17} color={reward.color} />
                    </View>
                    <Text className="ml-3 flex-1 text-sm font-black text-[#0B2551]">
                      {reward.label}
                    </Text>
                    <Ionicons name="checkmark-circle" size={19} color={colors.green} />
                  </View>
                </Animated.View>
              ))}
            </View>

            <Animated.View entering={FadeIn.delay(360).duration(180)}>
              <View className="mt-1 flex-row items-end justify-between">
                <CelebrationButton
                  icon="bag-check"
                  label="Collect rewards"
                  color={colors.blue}
                  onPress={() => setPage("streak")}
                />
                <View className="-mb-2 ml-3">
                  <PixelParrot size="sm" mirrorX />
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInRight.duration(280)}>
            <View className="items-center px-2 pb-1 pt-4">
              <Animated.View entering={BounceIn.delay(80).duration(380)}>
                <View className="h-24 w-24 items-center justify-center rounded-full border-4 border-[#FFD6CE] bg-[#FFF0EC]">
                  <Ionicons name="flame" size={54} color={colors.red} />
                </View>
              </Animated.View>
              <Text className="mt-4 text-xs font-extrabold uppercase text-[#C95D49]">
                Quest momentum
              </Text>
              <Text className="mt-1 text-center text-2xl font-black text-[#0B2551]">
                Streak extended!
              </Text>
              <View className="mt-4 flex-row items-end justify-center">
                <Text
                  className="text-6xl font-black text-[#0B2551]"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {details.streak}
                </Text>
                <Text className="mb-2 ml-2 text-sm font-extrabold uppercase text-[#6D7890]">
                  {details.streak === 1 ? "day" : "days"}
                </Text>
              </View>
              <Text className="mt-2 text-center text-sm font-semibold leading-5 text-[#6D7890]">
                Your {details.habitLabel} adventure is ready for tomorrow.
              </Text>
              <CelebrationButton
                icon="arrow-forward"
                label="Continue adventure"
                color={colors.blue}
                onPress={onClose}
              />
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function PowerUpCelebration({ onClose }: { onClose: () => void }) {
  return (
    <View style={{ width: "100%", maxWidth: 360 }}>
      <View
        className="overflow-hidden rounded-lg border border-[#B7DDF9] bg-[#FFFDF7]"
        style={shadows.card}
      >
        <View className="relative h-[210px] items-center justify-center overflow-hidden bg-[#DFF5FF]">
          <CloseButton onPress={onClose} />
          <View
            style={{
              position: "absolute",
              width: 176,
              height: 176,
              borderRadius: 88,
              borderWidth: 12,
              borderColor: "#B8E4FA"
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 128,
              height: 128,
              borderRadius: 64,
              borderWidth: 8,
              borderColor: "#72B9F3"
            }}
          />
          <Animated.View
            entering={BounceIn.delay(60).duration(300)}
            style={{
              width: 132,
              height: 132,
              borderRadius: 66,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#DFF5FF"
            }}
          >
            <PixelParrot size="lg" mirrorX />
          </Animated.View>
          <Animated.View
            entering={FadeInUp.delay(180).duration(220)}
            style={{
              position: "absolute",
              bottom: 12,
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#A7D5F5",
              backgroundColor: "white",
              paddingHorizontal: 12,
              paddingVertical: 8
            }}
          >
            <Ionicons name="flash" size={16} color={colors.blueDark} />
            <Text className="ml-1 text-xs font-black text-[#2F80ED]">MOMENTUM +1</Text>
          </Animated.View>
        </View>

        <View className="items-center px-5 py-5">
          <Text className="text-xs font-extrabold uppercase text-[#2F80ED]">Power-up unlocked</Text>
          <Text className="mt-1 text-center text-2xl font-black text-[#0B2551]">Momentum charged!</Text>
          <Text className="mt-2 text-center text-sm font-semibold leading-5 text-[#6D7890]">
            Today's win strengthens your next step on the trail.
          </Text>
          <View className="mt-4 w-full flex-row items-center justify-center rounded-lg border border-[#CCE5F8] bg-[#F4FAFF] px-3 py-3">
            <Ionicons name="flame" size={19} color={colors.red} />
            <Text className="ml-2 text-sm font-black text-[#0B2551]">Streak protected for today</Text>
          </View>
          <CelebrationButton
            icon="flash"
            label="Carry momentum"
            color={colors.blueDark}
            onPress={onClose}
          />
        </View>
      </View>
    </View>
  );
}

function RewardRow({ coinReward, xpReward }: { coinReward: number; xpReward: number }) {
  return (
    <View className="mt-4 flex-row items-center justify-center">
      <View className="flex-row items-center rounded-full bg-[#FFF3D6] px-3 py-2">
        <Ionicons name="ellipse" size={14} color={colors.gold} />
        <Text className="ml-1 text-xs font-black text-[#8A671E]">+{coinReward}</Text>
      </View>
      <View className="ml-2 flex-row items-center rounded-full bg-[#E9F8EE] px-3 py-2">
        <Ionicons name="sparkles" size={14} color={colors.green} />
        <Text className="ml-1 text-xs font-black text-[#4C8060]">+{xpReward} XP</Text>
      </View>
    </View>
  );
}

function CelebrationButton({
  color,
  icon,
  label,
  onPress
}: {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="mt-5 h-12 min-w-[190px] flex-row items-center justify-center rounded-lg px-5"
      style={{ backgroundColor: color }}
      activeOpacity={0.86}
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color="white" />
      <Text className="ml-2 text-sm font-black text-white">{label}</Text>
    </TouchableOpacity>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      className="absolute right-3 top-3 z-10 h-9 w-9 items-center justify-center rounded-full bg-white"
      activeOpacity={0.82}
      accessibilityLabel="Close celebration"
      accessibilityRole="button"
      onPress={onPress}
    >
      <Ionicons name="close" size={19} color={colors.ink} />
    </TouchableOpacity>
  );
}
