import { memo, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InventoryStackDetailsModal } from "../../components/InventoryStackDetailsModal";
import {
  QuestCelebrationModal,
  type LootDropDetails
} from "../../components/QuestCelebrationModal";
import { QuestActionButton } from "../../components/QuestActionButton";
import { ResourceBar } from "../../components/ResourceBar";
import { colors } from "../../constants/colors";
import { equipmentRaritiesById } from "../../constants/equipment";
import { loadoutSlots } from "../../constants/profile";
import { useGameActions, useGameQuests, useGameSync } from "../../contexts/appContext";
import { shadows } from "../../styles/shadows";
import { getGuildQuestTimeRemaining } from "../../utility/guildQuests";
import type { GuildQuestView } from "../../utility/guildQuests";

type GuildScreenProps = {
  onDailyCheckInPress: () => void;
};

export function GuildScreen({ onDailyCheckInPress }: GuildScreenProps) {
  const insets = useSafeAreaInsets();
  const { mutationInFlight, isOnline } = useGameSync();
  const { sideCandidates, mainCandidates, timeZone } = useGameQuests();
  const { acceptGuildQuest, claimGuildQuestReward } = useGameActions();
  const [lootDropDetails, setLootDropDetails] = useState<LootDropDetails | null>(null);
  const [selectedRewardPreview, setSelectedRewardPreview] = useState<GuildQuestView["rewardPreview"] | null>(null);
  const [pendingAcceptQuestId, setPendingAcceptQuestId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const isBusy = mutationInFlight !== null;
  const contentPaddingBottom = Math.max(112, insets.bottom + 96);
  const acceptedSideCount = sideCandidates.filter((quest) => quest.isLocked).length;
  const acceptedMainCount = mainCandidates.filter((quest) => quest.isLocked).length;

  const acceptQuest = async (quest: GuildQuestView) => {
    if (!isOnline || isBusy || quest.isLocked) return;
    setPendingAcceptQuestId(quest.definition.id);
    try {
      await acceptGuildQuest(quest.definition.kind, quest.definition.id);
    } catch {
      // SyncStatusBanner provides retry guidance for failed mutations.
    } finally {
      setPendingAcceptQuestId(null);
    }
  };

  const claimQuest = async (quest: GuildQuestView) => {
    if (!isOnline || isBusy || quest.isClaimed || !quest.progress.completed) return;
    try {
      const outcome = await claimGuildQuestReward(quest.definition.kind, quest.definition.id);
      if (!outcome.lootItem) return;
      setLootDropDetails({
        coinReward: outcome.coinReward,
        xpReward: outcome.xpReward,
        streak: 0,
        habitLabel: quest.definition.title,
        lootItem: outcome.lootItem,
        finalEyebrow: "Guild board",
        finalTitle: "Quest reward secured!",
        finalDescription: `${quest.definition.title} is complete. Your new gear is ready in the Stash.`,
        finalActionLabel: "Return to Guild",
        showStreak: false
      });
    } catch {
      // SyncStatusBanner provides retry guidance for failed mutations.
    }
  };

  return (
    <>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-3"
        contentContainerStyle={{
          flexGrow: 0,
          paddingBottom: contentPaddingBottom
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        style={{ minHeight: 0 }}
      >
        <ResourceBar onDailyCheckInPress={onDailyCheckInPress} />

        <GuildSectionHeader eyebrow="Weekly board" title="Side Quests" />
        {sideCandidates.map((quest) => (
          <GuildQuestCard
            key={quest.definition.id}
            quest={quest}
            now={now}
            timeZone={timeZone}
            acceptDisabled={
              !isOnline || isBusy || acceptedSideCount >= 3
            }
            acceptLoading={pendingAcceptQuestId === quest.definition.id}
            claimDisabled={isBusy || !isOnline}
            onAccept={() => void acceptQuest(quest)}
            onClaim={() => void claimQuest(quest)}
            onRewardPress={() => setSelectedRewardPreview(quest.rewardPreview)}
          />
        ))}

        <GuildSectionHeader eyebrow="Monthly board" title="Main Quest" />
        {mainCandidates.map((quest) => (
          <GuildQuestCard
            key={quest.definition.id}
            quest={quest}
            now={now}
            timeZone={timeZone}
            featured
            acceptDisabled={
              !isOnline || isBusy || acceptedMainCount >= 1
            }
            acceptLoading={pendingAcceptQuestId === quest.definition.id}
            claimDisabled={isBusy || !isOnline}
            onAccept={() => void acceptQuest(quest)}
            onClaim={() => void claimQuest(quest)}
            onRewardPress={() => setSelectedRewardPreview(quest.rewardPreview)}
          />
        ))}
      </ScrollView>

      <InventoryStackDetailsModal
        onClose={() => setSelectedRewardPreview(null)}
        preview={selectedRewardPreview}
        stack={null}
      />

      <QuestCelebrationModal
        variant={lootDropDetails ? "loot-drop" : null}
        lootDropDetails={lootDropDetails ?? undefined}
        onClose={() => setLootDropDetails(null)}
      />
    </>
  );
}

const GuildSectionHeader = memo(function GuildSectionHeader({
  eyebrow,
  title
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <View className="mb-3 mt-6">
      <Text className="text-xs font-extrabold uppercase text-primary-strong">{eyebrow}</Text>
      <Text className="mt-1 text-2xl font-black text-content">{title}</Text>
    </View>
  );
});

const GuildQuestCard = memo(function GuildQuestCard({
  quest,
  featured = false,
  onAccept,
  acceptDisabled = false,
  acceptLoading = false,
  onClaim,
  claimDisabled = false,
  onRewardPress,
  now,
  timeZone
}: {
  quest: GuildQuestView;
  featured?: boolean;
  onAccept?: () => void;
  acceptDisabled?: boolean;
  acceptLoading?: boolean;
  onClaim?: () => void;
  claimDisabled?: boolean;
  onRewardPress: () => void;
  now: Date;
  timeZone: string;
}) {
  const { definition, progress, period, rewardPreview, isClaimed } = quest;
  const percent = Math.round(progress.percent * 100);
  const isReadyToClaim = quest.isLocked && progress.completed && !isClaimed;
  const timeRemaining = getGuildQuestTimeRemaining(period, timeZone, now);
  const cardClass = quest.isLocked
    ? "border-primary-strong bg-surface-blue"
    : featured
      ? "border-line-hero bg-surface-card"
      : "border-line bg-surface-card";

  return (
    <View
      className={`mb-2 rounded-card border p-3 ${cardClass}`}
      style={[shadows.card, { alignSelf: "stretch", flexGrow: 0, flexShrink: 0 }]}
    >
      <View className="flex-row items-stretch">
        <View className="min-w-0 flex-1 pr-2">
          <View className="flex-row items-start">
            <View
              className={`h-9 w-9 items-center justify-center rounded-card ${
                featured ? "bg-surface-blue" : "bg-surface-green"
              }`}
            >
              <Ionicons name={definition.icon} size={19} color={featured ? colors.blueDark : colors.green} />
            </View>
            <View className="ml-2 min-w-0 flex-1">
              <View className="flex-row items-start">
                <Text className="flex-1 text-sm font-black text-content">{definition.title}</Text>
                {quest.isLocked ? (
                  <Ionicons
                    name={isClaimed ? "checkmark-circle" : "lock-closed"}
                    size={17}
                    color={isClaimed ? colors.green : colors.blueDark}
                  />
                ) : null}
              </View>
              <Text className="mt-1 text-xs font-semibold leading-4 text-content-muted">
                {definition.description}
              </Text>
            </View>
          </View>

          <View className="mt-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-black text-content-muted">
                {progress.current}/{progress.target}
              </Text>
              <Text className={`text-xs font-black ${timeRemaining.urgent ? "text-danger" : "text-content-muted"}`}>
                {timeRemaining.label}
              </Text>
            </View>
            <View className="mt-2 h-2 overflow-hidden rounded-pill bg-line-progress">
              <View className="h-full rounded-pill bg-primary-strong" style={{ width: `${percent}%` }} />
            </View>
            {typeof progress.secondaryTarget === "number" ? (
              <Text className="mt-1 text-micro font-black text-content-muted">
                Timed {progress.current}/{progress.target} - One-time {progress.secondaryCurrent ?? 0}/{progress.secondaryTarget}
              </Text>
            ) : null}
            <View className="mt-2 flex-row">
              <RewardChip
                className="mr-1 flex-1"
                icon="ellipse"
                label={`+${definition.reward.coins}`}
                color={colors.gold}
              />
              <RewardChip
                className="ml-1 flex-1"
                icon="sparkles"
                label={`+${definition.reward.xp} XP`}
                color={colors.green}
              />
            </View>
          </View>
        </View>

        <View
          className="ml-1 items-center justify-center"
          style={{ flexGrow: 0, flexShrink: 0, width: 84 }}
        >
          <GuildRewardPreview preview={rewardPreview} onPress={onRewardPress} />
        </View>
      </View>

      <View className="mt-3">
        {!quest.isLocked ? (
          <QuestActionButton
            disabled={acceptDisabled}
            icon="checkmark-circle-outline"
            label="Accept quest"
            loading={acceptLoading}
            mode="tap"
            onAction={onAccept ?? (() => undefined)}
          />
        ) : isReadyToClaim ? (
          <QuestActionButton
            disabled={claimDisabled}
            icon="gift-outline"
            label="Claim rewards"
            mode="tap"
            onAction={onClaim ?? (() => undefined)}
          />
        ) : isClaimed ? (
          <View className="flex-row items-center justify-center rounded-card border border-line-success bg-success-soft px-3 py-3">
            <Ionicons name="checkmark-circle" size={18} color={colors.green} />
            <Text className="ml-2 text-sm font-black text-content-green">Reward claimed</Text>
          </View>
        ) : (
          <QuestActionButton
            disabled
            icon="lock-closed-outline"
            label="Quest accepted"
            mode="tap"
            onAction={() => undefined}
            variant="secondary"
          />
        )}
      </View>
    </View>
  );
});

function RewardChip({
  className = "",
  icon,
  label,
  color
}: {
  className?: string;
  icon: "ellipse" | "sparkles" | "gift-outline";
  label: string;
  color: string;
}) {
  return (
    <View className={`${className} flex-row items-center rounded-pill bg-surface-panel px-2 py-1`}>
      <Ionicons name={icon} size={12} color={color} />
      <Text className="ml-1 text-micro font-black text-content">{label}</Text>
    </View>
  );
}

const GuildRewardPreview = memo(function GuildRewardPreview({
  onPress,
  preview
}: {
  onPress: () => void;
  preview: GuildQuestView["rewardPreview"];
}) {
  const slotLabel = loadoutSlots.find((slot) => slot.id === preview.definition.slotId)?.label ?? "Gear";
  const rarityLabel = equipmentRaritiesById[preview.rarity]?.label ?? preview.rarity;

  return (
    <Pressable
      accessibilityLabel={`${preview.definition.name} reward preview, ${rarityLabel} ${slotLabel}`}
      accessibilityRole="button"
      className="min-w-0 rounded-card p-1"
      onPress={onPress}
      style={{
        alignSelf: "center",
        backgroundColor: colors.raritySoft[preview.rarity],
        borderColor: colors.rarity[preview.rarity],
        borderWidth: 2,
        flexGrow: 0,
        flexShrink: 0,
        height: 84,
        width: 84,
      }}
    >
      <Image
        accessible={false}
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={preview.definition.image}
        style={{ alignSelf: "center", height: 36, width: 58 }}
      />
      <Text className="mt-0.5 text-center text-micro font-black text-content" numberOfLines={2}>
        {preview.definition.name}
      </Text>
      <Text className="mt-0.5 text-center text-micro font-black text-content-muted" numberOfLines={1}>
        {rarityLabel} {slotLabel}
      </Text>
    </Pressable>
  );
});
