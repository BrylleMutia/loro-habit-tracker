import { useState } from "react";
import { Image, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  BounceIn,
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp
} from "react-native-reanimated";

import { colors } from "../constants/colors";
import {
  equipmentItems,
  equipmentItemsById,
  equipmentRaritiesById
} from "../constants/equipment";
import { equipmentAttributes, loadoutSlots } from "../constants/profile";
import { shadows } from "../styles/shadows";
import type { EquipmentAttributeId, InventoryItem } from "../types/app";
import type { QuestActionMode } from "./QuestActionButton";
import { PixelParrot } from "./PixelParrot";
import { QuestActionButton } from "./QuestActionButton";

export type CelebrationVariant = "trail-stamp" | "loot-drop";

export type LootDropDetails = {
  coinReward: number;
  xpReward: number;
  streak: number;
  habitLabel: string;
  lootItem: InventoryItem;
  finalEyebrow?: string;
  finalTitle?: string;
  finalDescription?: string;
  finalActionLabel?: string;
  showStreak?: boolean;
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
  trailStampActionDisabled?: boolean;
  trailStampActionMode?: QuestActionMode;
  trailStampDetails?: TrailStampDetails;
};

const defaultLootDropDetails: LootDropDetails = {
  coinReward: 20,
  xpReward: 32,
  streak: 1,
  habitLabel: "Daily Quest",
  lootItem: {
    id: "preview-wayfinder-cap",
    itemDefinitionId: equipmentItems[0].id,
    name: equipmentItems[0].name,
    setId: equipmentItems[0].setId,
    setName: equipmentItems[0].setName,
    slotId: equipmentItems[0].slotId,
    rarity: "rare",
    stats: { intelligence: 2, luck: 1 },
    acquiredAt: new Date(0).toISOString(),
    sourceHabitId: "exercise",
    sourceNodeId: "preview-node",
    sourceDateKey: "1970-01-01"
  }
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
  trailStampActionDisabled = false,
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
            actionDisabled={trailStampActionDisabled}
            onClose={onClose}
          />
        ) : null}
        {variant === "loot-drop" ? (
          <LootDropCelebration details={lootDropDetails} onClose={onClose} />
        ) : null}
      </Animated.View>
    </Modal>
  );
}

function TrailStampCelebration({
  actionMode,
  actionDisabled,
  details,
  onAction,
  onClose
}: {
  actionMode: QuestActionMode;
  actionDisabled: boolean;
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
              disabled={actionDisabled}
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
  const lootItem = details.lootItem;
  const itemDefinition = equipmentItemsById[lootItem.itemDefinitionId] ?? equipmentItems[0];
  const rarity = equipmentRaritiesById[lootItem.rarity];
  const slotLabel = loadoutSlots.find((slot) => slot.id === lootItem.slotId)?.label ?? "Gear";
  const stats = Object.entries(lootItem.stats) as [EquipmentAttributeId, number][];

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
                <View className="h-14 w-14 items-center justify-center rounded-card border border-line-reward-strong bg-reward-soft">
                  <Ionicons name="gift" size={30} color={colors.gold} />
                </View>
              </Animated.View>
              <View className="ml-4 flex-1">
                <Text className="text-xs font-extrabold uppercase text-content-gold-strong">Loot drop</Text>
                <Text className="mt-1 text-xl font-black text-content">New gear discovered!</Text>
              </View>
            </View>

            <Animated.View entering={FadeInUp.delay(120).duration(260)}>
              <View className="mt-4 flex-row rounded-card border border-line bg-surface-panel p-3">
                <View
                  className="h-28 w-28 items-center justify-center overflow-hidden rounded-card"
                  style={{
                    borderColor: colors.rarity[rarity.id],
                    borderWidth: 4,
                    backgroundColor: colors.raritySoft[rarity.id]
                  }}
                >
                  <Image
                    accessibilityLabel={`${rarity.label} ${lootItem.name}`}
                    resizeMode="contain"
                    source={itemDefinition.image}
                    style={{ height: 104, width: 104 }}
                  />
                </View>

                <View className="ml-3 flex-1 justify-center">
                  <Text
                    className="text-xs font-black uppercase"
                    style={{ color: colors.rarity[rarity.id] }}
                  >
                    {rarity.label} {slotLabel}
                  </Text>
                  <Text className="mt-1 text-lg font-black leading-5 text-content">
                    {lootItem.name}
                  </Text>
                  <View className="mt-2 self-start flex-row items-center rounded-pill border border-line-success bg-success-soft px-2 py-1">
                    <Ionicons name="leaf-outline" size={11} color={colors.green} />
                    <Text className="ml-1 text-micro font-extrabold text-content-green">
                      {lootItem.setName}
                    </Text>
                  </View>
                  <View className="mt-2 flex-row flex-wrap">
                    {stats.map(([attributeId, amount]) => {
                      const attribute = equipmentAttributes.find(({ id }) => id === attributeId);
                      return (
                        <View
                          key={attributeId}
                          className="mb-1 mr-1 flex-row items-center rounded-pill bg-white px-2 py-1"
                        >
                          <Ionicons
                            name={attribute?.icon ?? "sparkles-outline"}
                            size={12}
                            color={colors.blueDark}
                          />
                          <Text className="ml-1 text-micro font-black text-content">
                            {attribute?.label ?? attributeId} +{amount}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </Animated.View>

            <View className="mt-3 border-y border-line-reward-muted py-1">
              {rewards.map((reward, index) => (
                <Animated.View
                  key={reward.label}
                  entering={FadeInUp.delay(130 + index * 90).duration(240)}
                >
                  <View className="h-9 flex-row items-center">
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
              {details.showStreak === false ? (
                <>
                  <Text className="mt-4 text-xs font-extrabold uppercase text-content-red">
                    {details.finalEyebrow ?? "Guild board"}
                  </Text>
                  <Text className="mt-1 text-center text-2xl font-black text-content">
                    {details.finalTitle ?? "Reward secured!"}
                  </Text>
                  <Text className="mt-4 text-center text-sm font-semibold leading-5 text-content-muted">
                    {details.finalDescription ?? `${details.habitLabel} is now part of your collection.`}
                  </Text>
                </>
              ) : (
                <>
                  <Text className="mt-4 text-xs font-extrabold uppercase text-content-red">
                    {details.finalEyebrow ?? "Quest momentum"}
                  </Text>
                  <Text className="mt-1 text-center text-2xl font-black text-content">
                    {details.finalTitle ?? "Streak extended!"}
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
                    {details.finalDescription ?? `Your ${details.habitLabel} adventure is ready for tomorrow.`}
                  </Text>
                </>
              )}
              <QuestActionButton
                className="mt-5 w-full"
                completedLabel={details.finalActionLabel ?? "Continuing"}
                icon={details.showStreak === false ? "shield-checkmark" : "arrow-forward"}
                label={details.showStreak === false ? "Continue guild trail" : "Continue adventure"}
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
