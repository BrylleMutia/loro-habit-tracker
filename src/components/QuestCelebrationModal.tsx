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
import type { QuestActionMode } from "./QuestActionButton";
import { PixelParrot } from "./PixelParrot";
import { QuestActionButton } from "./QuestActionButton";

export type CelebrationVariant = "trail-stamp" | "loot-drop" | "power-up";

export type LootDropDetails = {
  coinReward: number;
  xpReward: number;
  streak: number;
  habitLabel: string;
};

export type TrailStampDetails = {
  actionLabel: string;
  badgeLabel: string;
  coinReward: number;
  description: string;
  energyReward?: number;
  title: string;
  xpReward?: number;
};

type QuestCelebrationModalProps = {
  variant: CelebrationVariant | null;
  onClose: () => void;
  lootDropDetails?: LootDropDetails;
  onTrailStampAction?: () => void;
  trailStampActionMode?: QuestActionMode;
  trailStampDetails?: TrailStampDetails;
};

const defaultLootDropDetails: LootDropDetails = {
  coinReward: 20,
  xpReward: 32,
  streak: 1,
  habitLabel: "Daily Quest"
};

const defaultTrailStampDetails: TrailStampDetails = {
  actionLabel: "Continue trail",
  badgeLabel: "Trail stamp earned",
  coinReward: 20,
  description: "Foundation Circuit is now part of your adventure.",
  title: "Quest complete!",
  xpReward: 32
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
  lootDropDetails = defaultLootDropDetails,
  onTrailStampAction,
  trailStampActionMode = "tap",
  trailStampDetails = defaultTrailStampDetails
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
          backgroundColor: colors.overlay,
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
        {variant === "trail-stamp" ? (
          <TrailStampCelebration
            details={trailStampDetails}
            onAction={onTrailStampAction ?? onClose}
            actionMode={trailStampActionMode}
            onClose={onClose}
          />
        ) : null}
        {variant === "loot-drop" ? (
          <LootDropCelebration details={lootDropDetails} onClose={onClose} />
        ) : null}
        {variant === "power-up" ? <PowerUpCelebration onClose={onClose} /> : null}
      </Animated.View>
    </Modal>
  );
}

function TrailStampCelebration({
  actionMode,
  details,
  onAction,
  onClose
}: {
  actionMode: QuestActionMode;
  details: TrailStampDetails;
  onAction: () => void;
  onClose: () => void;
}) {
  return (
    <View style={{ width: "100%", maxWidth: 360 }}>
      <View
        className="overflow-hidden rounded-card border border-line-success bg-surface-card"
        style={shadows.card}
      >
        <View className="relative items-center bg-canvas-mint px-5 pb-5 pt-6">
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
            <View className="-mt-2 h-14 w-14 items-center justify-center rounded-pill border-4 border-white bg-success">
              <Ionicons name="checkmark" size={30} color="white" />
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(170).duration(240)}>
          <View className="items-center px-5 py-5">
            <Text className="text-xs font-extrabold uppercase text-content-green">
              {details.badgeLabel}
            </Text>
            <Text className="mt-1 text-center text-2xl font-black text-content">
              {details.title}
            </Text>
            <Text className="mt-2 text-center text-sm font-semibold leading-5 text-content-muted">
              {details.description}
            </Text>
            <RewardRow
              coinReward={details.coinReward}
              energyReward={details.energyReward}
              xpReward={details.xpReward}
            />
            <QuestActionButton
              className="mt-5 w-full"
              completedLabel={actionMode === "hold" ? "Reward claimed" : "Continuing"}
              icon="checkmark-circle"
              label={details.actionLabel}
              mode={actionMode}
              onAction={onAction}
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
        className="rounded-card border border-line-reward bg-surface-card p-5"
        style={shadows.card}
      >
        <CloseButton onPress={onClose} />
        {page === "rewards" ? (
          <Animated.View entering={FadeIn.duration(180)}>
            <View className="flex-row items-center pr-8">
              <Animated.View entering={BounceIn.delay(80).duration(360)}>
                <View className="h-20 w-20 items-center justify-center rounded-card border border-line-reward-strong bg-reward-soft">
                  <Ionicons name="gift" size={42} color={colors.gold} />
                </View>
              </Animated.View>
              <View className="ml-4 flex-1">
                <Text className="text-xs font-extrabold uppercase text-content-gold-strong">Loot drop</Text>
                <Text className="mt-1 text-2xl font-black text-content">Rewards secured</Text>
                <Text className="mt-1 text-sm font-semibold leading-5 text-content-muted">
                  Lory packed your quest haul.
                </Text>
              </View>
            </View>

            <View className="mt-5 border-y border-line-reward-muted py-2">
              {rewards.map((reward, index) => (
                <Animated.View
                  key={reward.label}
                  entering={FadeInUp.delay(130 + index * 90).duration(240)}
                >
                  <View className="h-11 flex-row items-center">
                    <View className="h-8 w-8 items-center justify-center rounded-card bg-canvas-cream">
                      <Ionicons name={reward.icon} size={17} color={reward.color} />
                    </View>
                    <Text className="ml-3 flex-1 text-sm font-black text-content">
                      {reward.label}
                    </Text>
                    <Ionicons name="checkmark-circle" size={19} color={colors.green} />
                  </View>
                </Animated.View>
              ))}
            </View>

            <Animated.View entering={FadeIn.delay(360).duration(180)}>
              <View className="mt-1 flex-row items-end justify-between">
                <QuestActionButton
                  className="mt-5 flex-1"
                  completedLabel="Rewards collected"
                  icon="bag-check"
                  label="Collect rewards"
                  mode="tap"
                  onAction={() => setPage("streak")}
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
                <View className="h-24 w-24 items-center justify-center rounded-pill border-4 border-line-red bg-surface-red">
                  <Ionicons name="flame" size={54} color={colors.red} />
                </View>
              </Animated.View>
              <Text className="mt-4 text-xs font-extrabold uppercase text-content-red">
                Quest momentum
              </Text>
              <Text className="mt-1 text-center text-2xl font-black text-content">
                Streak extended!
              </Text>
              <View className="mt-4 flex-row items-end justify-center">
                <Text
                  className="text-6xl font-black text-content"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {details.streak}
                </Text>
                <Text className="mb-2 ml-2 text-sm font-extrabold uppercase text-content-muted">
                  {details.streak === 1 ? "day" : "days"}
                </Text>
              </View>
              <Text className="mt-2 text-center text-sm font-semibold leading-5 text-content-muted">
                Your {details.habitLabel} adventure is ready for tomorrow.
              </Text>
              <QuestActionButton
                className="mt-5 w-full"
                completedLabel="Continuing"
                icon="arrow-forward"
                label="Continue adventure"
                mode="tap"
                onAction={onClose}
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
        className="overflow-hidden rounded-card border border-line-hero bg-surface-card"
        style={shadows.card}
      >
        <View className="relative h-hero items-center justify-center overflow-hidden bg-canvas-sky">
          <CloseButton onPress={onClose} />
          <View
            style={{
              position: "absolute",
              width: 176,
              height: 176,
              borderRadius: 88,
              borderWidth: 12,
              borderColor: colors.lineBlueStrong
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 128,
              height: 128,
              borderRadius: 64,
              borderWidth: 8,
              borderColor: colors.lineBlueAccent
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
              backgroundColor: colors.sky
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
              borderColor: colors.lineBlueMuted,
              backgroundColor: "white",
              paddingHorizontal: 12,
              paddingVertical: 8
            }}
          >
            <Ionicons name="flash" size={16} color={colors.blueDark} />
            <Text className="ml-1 text-xs font-black text-primary-strong">MOMENTUM +1</Text>
          </Animated.View>
        </View>

        <View className="items-center px-5 py-5">
          <Text className="text-xs font-extrabold uppercase text-primary-strong">Power-up unlocked</Text>
          <Text className="mt-1 text-center text-2xl font-black text-content">Momentum charged!</Text>
          <Text className="mt-2 text-center text-sm font-semibold leading-5 text-content-muted">
            Today's win strengthens your next step on the trail.
          </Text>
          <View className="mt-4 w-full flex-row items-center justify-center rounded-card border border-line-primary bg-surface-blue px-3 py-3">
            <Ionicons name="flame" size={19} color={colors.red} />
            <Text className="ml-2 text-sm font-black text-content">Streak protected for today</Text>
          </View>
          <QuestActionButton
            className="mt-5 w-full"
            completedLabel="Momentum carried"
            icon="flash"
            label="Carry momentum"
            mode="tap"
            onAction={onClose}
          />
        </View>
      </View>
    </View>
  );
}

function RewardRow({
  coinReward,
  energyReward,
  xpReward
}: {
  coinReward: number;
  energyReward?: number;
  xpReward?: number;
}) {
  return (
    <View className="mt-4 flex-row items-center justify-center">
      <View className="flex-row items-center rounded-pill bg-reward-soft px-3 py-2">
        <Ionicons name="ellipse" size={14} color={colors.gold} />
        <Text className="ml-1 text-xs font-black text-content-gold">+{coinReward}</Text>
      </View>
      {typeof xpReward === "number" ? (
        <View className="ml-2 flex-row items-center rounded-pill bg-success-soft px-3 py-2">
          <Ionicons name="sparkles" size={14} color={colors.green} />
          <Text className="ml-1 text-xs font-black text-content-green">+{xpReward} XP</Text>
        </View>
      ) : null}
      {typeof energyReward === "number" ? (
        <View className="ml-2 flex-row items-center rounded-pill bg-primary-soft px-3 py-2">
          <Ionicons name="flash" size={14} color={colors.blueDark} />
          <Text className="ml-1 text-xs font-black text-primary-strong">
            +{energyReward} energy
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      className="absolute right-3 top-3 z-10 h-9 w-9 items-center justify-center rounded-pill bg-white"
      activeOpacity={0.82}
      accessibilityLabel="Close celebration"
      accessibilityRole="button"
      onPress={onPress}
    >
      <Ionicons name="close" size={19} color={colors.ink} />
    </TouchableOpacity>
  );
}
