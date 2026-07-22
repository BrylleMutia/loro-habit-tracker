import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import { QuestActionButton } from "../../components/QuestActionButton";
import { EquipmentLoadoutGrid } from "../../components/EquipmentLoadoutGrid";
import { SetShowcaseFrame } from "../../components/SetShowcaseFrame";
import { colors } from "../../constants/colors";
import { getEquipmentSetTheme } from "../../constants/equipmentSetThemes";
import { images } from "../../constants/images";
import {
  equipmentAttributes,
  profileBadges,
  type ProfileBadgeId
} from "../../constants/profile";
import { useAppState } from "../../contexts/appContext";
import { useScreenContentWidth } from "../../hooks/useScreenContentWidth";
import { shadows } from "../../styles/shadows";
import type { IconName, TabId } from "../../types/app";
import {
  getEquipmentSetProgressList,
  getFullyEquippedSetId,
  getOrderedEquipmentSetProgressList,
  normalizeEquipmentSetOrder,
  type EquipmentSetProgress
} from "../../utility/equipmentCollections";
import {
  formatTrackedHours,
  getEquipmentAttributeTotals,
  getProfileActivityStatistics
} from "../../utility/profile";

const badgeToneStyles = {
  primary: { background: "bg-primary-soft", border: "border-primary", color: colors.blueDark },
  success: { background: "bg-success-soft", border: "border-success", color: colors.green },
  reward: { background: "bg-reward-soft", border: "border-reward", color: colors.gold },
  danger: { background: "bg-surface-red", border: "border-danger", color: colors.red }
} as const;

type ProfileStatistic = {
  icon: IconName;
  label: string;
  value: string;
};

function formatClassName(classId: string) {
  return classId.charAt(0).toUpperCase() + classId.slice(1);
}

type ProfileScreenProps = {
  onNavigateToTab: (tab: TabId) => void;
};

export function ProfileScreen({ onNavigateToTab }: ProfileScreenProps) {
  const {
    dailyStreak,
    habitList,
    inventory,
    longestStreak,
    mutationInFlight,
    profile,
    updateProfile
  } = useAppState();
  const [isSetCollectionExpanded, setIsSetCollectionExpanded] = useState(true);
  const [isSetOrderModalVisible, setIsSetOrderModalVisible] = useState(false);
  const contentWidth = useScreenContentWidth();
  const profilePairHorizontalInset = 24;
  const profilePairGap = 12;
  const profileCardSize = Math.max(
    (contentWidth - profilePairHorizontalInset - profilePairGap) / 2,
    0
  );
  const activityStatistics = getProfileActivityStatistics(habitList);
  const { completedChapters, completedQuests } = activityStatistics;
  const xpProgressPercent =
    profile.xpToNextLevel > 0
      ? Math.min((profile.xp / profile.xpToNextLevel) * 100, 100)
      : 0;
  const attributeTotals = getEquipmentAttributeTotals(profile.equippedItemIds, inventory.items);
  const equipmentSetProgress = getEquipmentSetProgressList(
    inventory.discoveredItemDefinitionIds ?? []
  );
  const orderedEquipmentSetProgress = getOrderedEquipmentSetProgressList(
    inventory.discoveredItemDefinitionIds ?? [],
    profile.setCollectionOrder
  );
  const featuredSetProgress = orderedEquipmentSetProgress[0] ?? null;
  const completedSetCount = equipmentSetProgress.filter((set) => set.isComplete).length;
  const fullyEquippedSetId = getFullyEquippedSetId(profile.equippedItemIds, inventory.items);
  const avatarSource =
    profile.avatarVariant === "alternate"
      ? images.classAvatarAlternates[profile.avatarClassId]
      : images.classAvatars[profile.avatarClassId];
  const unlockedBadgeIds = new Set<ProfileBadgeId>([
    "new-adventurer",
    ...(completedQuests > 0 ? (["first-quest"] as ProfileBadgeId[]) : []),
    ...(longestStreak >= 7 ? (["week-streak"] as ProfileBadgeId[]) : []),
    ...(completedChapters > 0 ? (["chapter-one"] as ProfileBadgeId[]) : [])
  ]);
  const statistics: ProfileStatistic[] = [
    {
      icon: "time-outline",
      label: "Total hours",
      value: formatTrackedHours(activityStatistics.totalTrackedSeconds)
    },
    { icon: "flame-outline", label: "Longest streak", value: `${longestStreak} days` },
    { icon: "checkmark-circle-outline", label: "Quests completed", value: `${completedQuests}` },
    { icon: "calendar-outline", label: "Active days", value: `${activityStatistics.activeDays}` },
    { icon: "flag-outline", label: "Chapters cleared", value: `${completedChapters}` },
    {
      icon: "ribbon-outline",
      label: "Badges earned",
      value: `${unlockedBadgeIds.size + completedSetCount}`
    }
  ];

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-28 pt-3"
      contentContainerStyle={{ width: "100%" }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={{ minHeight: 0 }}
    >
      <View className="self-center" style={{ width: contentWidth }}>
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-2xl font-black text-content">Profile</Text>
        <TouchableOpacity
          className="h-10 w-10 items-center justify-center rounded-card bg-surface-card"
          style={shadows.card}
          activeOpacity={0.82}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          onPress={() => onNavigateToTab("more")}
        >
          <Ionicons name="settings-outline" size={21} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View className="mt-4 h-52 overflow-hidden rounded-card bg-canvas-sky">
        <Image
          source={images.headerBackground}
          resizeMode="cover"
          className="absolute inset-0 h-full w-full opacity-80"
          accessibilityIgnoresInvertColors
        />
        <View className="absolute inset-0 px-5 pt-5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-display text-2xl font-black text-content">
                {profile.name}
              </Text>
              <Text className="mt-1 text-xs font-extrabold uppercase text-content-blue-muted">
                {formatClassName(profile.avatarClassId)} Adventurer
              </Text>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-card border-2 border-primary bg-surface-card">
              <Text className="text-micro font-extrabold uppercase text-content-muted">Level</Text>
              <Text className="text-lg font-black text-primary-strong">{profile.level}</Text>
            </View>
          </View>

          <View className="mt-4 flex-row items-center">
            <Ionicons name="flame" size={18} color={colors.red} />
            <Text className="ml-1 text-sm font-black text-content">{dailyStreak} day streak</Text>
            <View className="mx-3 h-4 w-px bg-line-blue" />
            <Text className="text-sm font-black text-content">
              {profile.xp} / {profile.xpToNextLevel} XP
            </Text>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-pill bg-line-progress">
            <View
              className="h-full rounded-pill bg-primary"
              style={{ width: `${xpProgressPercent}%` }}
            />
          </View>
        </View>
      </View>

      <View className="-mt-16 flex-row gap-3 px-3" style={{ height: profileCardSize }}>
        <View
          className="h-full min-w-0 flex-1 overflow-hidden rounded-card border border-line-primary bg-primary-soft"
          style={shadows.card}
        >
          <SetShowcaseFrame
            avatarSource={avatarSource}
            profileName={profile.name}
            setId={fullyEquippedSetId}
          />
          <TouchableOpacity
            className="absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-card bg-surface-card"
            activeOpacity={0.82}
            accessibilityLabel="Edit avatar"
            accessibilityRole="button"
            onPress={() => onNavigateToTab("shop")}
          >
            <Ionicons name="pencil" size={16} color={colors.blueDark} />
          </TouchableOpacity>
        </View>

        <View
          className="h-full min-w-0 flex-1 overflow-hidden rounded-card border border-line bg-surface-card p-3"
          style={shadows.card}
        >
          <Text className="text-xs font-black text-content">Attributes</Text>
          <View className="mt-2 h-px bg-line" />
          <View className="flex-1">
            {equipmentAttributes.map((attribute) => (
              <View key={attribute.id} className="flex-1 flex-row items-center">
                <Ionicons name={attribute.icon} size={15} color={colors.blueDark} />
                <Text className="ml-2 flex-1 text-xs font-extrabold uppercase text-content-muted">
                  {attribute.label}
                </Text>
                <Text className="text-sm font-black text-content">
                  +{attributeTotals[attribute.id]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <ProfileSectionHeader
        title="Equipment"
        actionIcon="shirt-outline"
        actionLabel="Edit gear"
        onAction={() => onNavigateToTab("shop")}
      />
      <EquipmentLoadoutGrid
        equippedItemIds={profile.equippedItemIds}
        inventoryItems={inventory.items}
      />

      <View className="mb-3 mt-5 flex-row items-center justify-between px-1">
        <Text className="text-sm font-black text-content">Set collection</Text>
        <View className="flex-row items-center">
          <Text className="mr-2 text-xs font-bold text-content-muted">
            {completedSetCount}/{equipmentSetProgress.length} mastered
          </Text>
          <TouchableOpacity
            className="h-8 w-8 items-center justify-center rounded-pill bg-surface-card"
            activeOpacity={0.82}
            accessibilityLabel={`${isSetCollectionExpanded ? "Collapse" : "Expand"} set collection`}
            accessibilityRole="button"
            onPress={() => setIsSetCollectionExpanded((expanded) => !expanded)}
          >
            <Ionicons
              name={isSetCollectionExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.blueDark}
            />
          </TouchableOpacity>
        </View>
      </View>
      {isSetCollectionExpanded ? (
        <>
          {featuredSetProgress ? <SetCollectionCard progress={featuredSetProgress} /> : null}
          <TouchableOpacity
            className="mt-2 flex-row items-center justify-center rounded-card border border-primary bg-primary-soft px-3 py-3"
            activeOpacity={0.82}
            accessibilityLabel="Arrange set collection order"
            accessibilityRole="button"
            onPress={() => setIsSetOrderModalVisible(true)}
          >
            <Ionicons name="swap-vertical-outline" size={17} color={colors.blueDark} />
            <Text className="ml-2 text-xs font-black uppercase text-primary-strong">
              Arrange sets
            </Text>
          </TouchableOpacity>
        </>
      ) : null}

      <SetCollectionOrderModal
        visible={isSetOrderModalVisible}
        order={profile.setCollectionOrder}
        progress={equipmentSetProgress}
        saving={mutationInFlight === "profile"}
        onClose={() => setIsSetOrderModalVisible(false)}
        onSave={(setCollectionOrder) => updateProfile({ setCollectionOrder })}
      />

      <ProfileSectionHeader
        title="Badges"
        actionLabel={`${unlockedBadgeIds.size}/${profileBadges.length} earned`}
      />
      <View
        className="rounded-card border border-line bg-surface-card p-3"
        style={shadows.card}
      >
        <View className="flex-row">
          {profileBadges.map((badge) => {
            const isUnlocked = unlockedBadgeIds.has(badge.id);
            const tone = badgeToneStyles[badge.tone];

            return (
              <View
                key={badge.id}
                className={`flex-1 items-center px-1 py-1 ${isUnlocked ? "" : "opacity-40"}`}
              >
                <View
                  className={`h-12 w-12 items-center justify-center rounded-pill border-2 ${tone.background} ${tone.border}`}
                >
                  <Ionicons
                    name={isUnlocked ? badge.icon : "lock-closed"}
                    size={21}
                    color={isUnlocked ? tone.color : colors.grayIcon}
                  />
                </View>
                <Text
                  className="mt-2 text-center text-micro font-bold text-content"
                  numberOfLines={2}
                >
                  {badge.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <ProfileSectionHeader title="Statistics" actionLabel="Lifetime" />
      {[statistics.slice(0, 2), statistics.slice(2, 4), statistics.slice(4, 6)].map(
        (row, rowIndex) => (
          <View key={`statistics-row-${rowIndex}`} className={`flex-row gap-3 ${rowIndex > 0 ? "mt-3" : ""}`}>
            {row.map((statistic) => (
              <ProfileStatisticCard key={statistic.label} statistic={statistic} />
            ))}
          </View>
        )
      )}

      </View>
    </ScrollView>
  );
}

function ProfileStatisticCard({ statistic }: { statistic: ProfileStatistic }) {
  return (
    <View
      className="h-24 min-w-0 flex-1 flex-row items-center rounded-card border border-line bg-surface-card p-3"
      style={shadows.card}
    >
      <View className="h-10 w-10 items-center justify-center rounded-card bg-primary-soft">
        <Ionicons name={statistic.icon} size={20} color={colors.blueDark} />
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <Text className="text-lg font-black text-content" numberOfLines={1}>
          {statistic.value}
        </Text>
        <Text className="mt-1 text-micro font-extrabold uppercase text-content-muted">
          {statistic.label}
        </Text>
      </View>
    </View>
  );
}

type SetCollectionOrderModalProps = {
  visible: boolean;
  order: readonly string[];
  progress: readonly EquipmentSetProgress[];
  saving: boolean;
  onClose: () => void;
  onSave: (order: string[]) => Promise<unknown>;
};

function SetCollectionOrderModal({
  visible,
  order,
  progress,
  saving,
  onClose,
  onSave
}: SetCollectionOrderModalProps) {
  const [draftOrder, setDraftOrder] = useState(() => normalizeEquipmentSetOrder(order));
  const progressBySetId = new Map(progress.map((set) => [set.setId, set]));

  useEffect(() => {
    if (visible) {
      setDraftOrder(normalizeEquipmentSetOrder(order));
    }
  }, [order, visible]);

  const moveSet = (setId: string, direction: -1 | 1) => {
    setDraftOrder((currentOrder) => {
      const currentIndex = currentOrder.indexOf(setId);
      const nextIndex = currentIndex + direction;

      if (
        currentIndex < 0 ||
        nextIndex < 0 ||
        nextIndex >= currentOrder.length
      ) {
        return currentOrder;
      }

      const nextOrder = [...currentOrder];
      [nextOrder[currentIndex], nextOrder[nextIndex]] = [
        nextOrder[nextIndex],
        nextOrder[currentIndex]
      ];
      return nextOrder;
    });
  };

  const saveOrder = async () => {
    try {
      await onSave(normalizeEquipmentSetOrder(draftOrder));
      onClose();
    } catch {
      // The provider exposes the sync error; keeping the modal open preserves the draft for retry.
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <SafeAreaView
          edges={["bottom"]}
          className="rounded-card bg-surface-card px-4 pt-4"
          style={shadows.card}
        >
          <View className="flex-row items-start justify-between">
            <View className="min-w-0 flex-1 pr-3">
              <Text className="font-display text-xl font-black text-content">
                Arrange sets
              </Text>
              <Text className="mt-1 text-xs font-bold text-content-muted">
                The first set is featured on your Profile.
              </Text>
            </View>
            <TouchableOpacity
              className="h-9 w-9 items-center justify-center rounded-pill bg-surface-muted"
              activeOpacity={0.82}
              accessibilityLabel="Close arrange sets modal"
              accessibilityRole="button"
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="mt-4"
            contentContainerClassName="gap-2"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 420 }}
          >
            {draftOrder.map((setId, index) => {
              const setProgress = progressBySetId.get(setId);
              const theme = getEquipmentSetTheme(setId);

              if (!setProgress || !theme) return null;

              const canMoveUp = index > 0 && !saving;
              const canMoveDown = index < draftOrder.length - 1 && !saving;

              return (
                <View
                  key={setId}
                  className="flex-row items-center rounded-card border p-3"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                  }}
                  accessible
                  accessibilityLabel={`${setProgress.setName}, position ${index + 1} of ${draftOrder.length}, ${setProgress.collectedCount} of ${setProgress.requiredCount} pieces collected`}
                >
                  <Text
                    className="w-6 text-center text-sm font-black"
                    style={{ color: theme.colors.accentStrong }}
                  >
                    {index + 1}
                  </Text>
                  <View
                    className="ml-2 h-10 w-10 items-center justify-center rounded-pill border-2"
                    style={{
                      backgroundColor: theme.colors.accentSoft,
                      borderColor: theme.colors.accent
                    }}
                  >
                    <Ionicons
                      name={theme.crestIcon}
                      size={19}
                      color={theme.colors.accentStrong}
                    />
                  </View>
                  <View className="ml-3 min-w-0 flex-1">
                    <Text className="text-xs font-black text-content" numberOfLines={1}>
                      {setProgress.setName}
                    </Text>
                    <Text
                      className="mt-1 text-micro font-extrabold uppercase"
                      style={{ color: theme.colors.accentStrong }}
                    >
                      {setProgress.collectedCount}/{setProgress.requiredCount}
                      {setProgress.isComplete ? " · Set Mastery" : " collected"}
                    </Text>
                  </View>
                  <View className="ml-2 flex-row">
                    <TouchableOpacity
                      className={`h-9 w-9 items-center justify-center rounded-pill bg-surface-card ${canMoveUp ? "" : "opacity-40"}`}
                      activeOpacity={0.82}
                      accessibilityLabel={`Move ${setProgress.setName} up`}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !canMoveUp }}
                      disabled={!canMoveUp}
                      onPress={() => moveSet(setId, -1)}
                    >
                      <Ionicons name="chevron-up" size={18} color={colors.blueDark} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`ml-1 h-9 w-9 items-center justify-center rounded-pill bg-surface-card ${canMoveDown ? "" : "opacity-40"}`}
                      activeOpacity={0.82}
                      accessibilityLabel={`Move ${setProgress.setName} down`}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !canMoveDown }}
                      disabled={!canMoveDown}
                      onPress={() => moveSet(setId, 1)}
                    >
                      <Ionicons name="chevron-down" size={18} color={colors.blueDark} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View className="mt-4 flex-row gap-2">
            <TouchableOpacity
              className={`min-h-11 flex-1 items-center justify-center rounded-card border border-line-red bg-surface-red px-3 ${saving ? "opacity-50" : ""}`}
              activeOpacity={0.82}
              accessibilityLabel="Cancel set order changes"
              accessibilityRole="button"
              disabled={saving}
              onPress={onClose}
            >
              <Text className="text-xs font-black uppercase text-content-red">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`min-h-11 flex-1 items-center justify-center rounded-card bg-primary px-3 ${saving ? "opacity-50" : ""}`}
              activeOpacity={0.82}
              accessibilityLabel="Save set order"
              accessibilityRole="button"
              accessibilityState={{ busy: saving, disabled: saving }}
              disabled={saving}
              onPress={saveOrder}
            >
              <Text className="text-xs font-black uppercase text-white">
                {saving ? "Saving" : "Save order"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function SetCollectionCard({ progress }: { progress: EquipmentSetProgress }) {
  const theme = getEquipmentSetTheme(progress.setId);
  if (!theme) return null;

  const progressPercent = progress.requiredCount
    ? (progress.collectedCount / progress.requiredCount) * 100
    : 0;

  return (
    <View
      className="flex-row items-center rounded-card border p-3"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
      accessible
      accessibilityLabel={`${progress.setName}, ${progress.collectedCount} of ${progress.requiredCount} pieces collected${progress.isComplete ? ", set mastery unlocked" : ""}`}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-pill border-2"
        style={{
          backgroundColor: theme.colors.accentSoft,
          borderColor: theme.colors.accent
        }}
      >
        <Ionicons
          name={theme.crestIcon}
          size={21}
          color={theme.colors.accentStrong}
        />
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-sm font-black text-content" numberOfLines={1}>
            {progress.setName}
          </Text>
          <Text
            className="ml-2 text-xs font-black"
            style={{ color: theme.colors.accentStrong }}
          >
            {progress.collectedCount}/{progress.requiredCount}
          </Text>
        </View>
        <View
          className="mt-2 h-2 overflow-hidden rounded-pill"
          style={{ backgroundColor: theme.colors.border }}
        >
          <View
            className="h-full rounded-pill"
            style={{
              backgroundColor: theme.colors.accent,
              width: `${progressPercent}%`
            }}
          />
        </View>
        <View
          className="mt-1 flex-row items-center self-start rounded-pill px-2 py-1"
          style={{
            backgroundColor: progress.isComplete
              ? theme.colors.accentStrong
              : theme.colors.accentSoft
          }}
        >
          {progress.isComplete ? (
            <Ionicons name="ribbon-outline" size={11} color={colors.card} />
          ) : null}
          <Text
            className="text-micro font-extrabold uppercase"
            style={{
              color: progress.isComplete ? colors.card : theme.colors.accentStrong,
              marginLeft: progress.isComplete ? 4 : 0
            }}
          >
            {progress.isComplete ? "Set Mastery" : "Collect every piece"}
          </Text>
        </View>
      </View>
      <Ionicons
        name={progress.isComplete ? "checkmark-circle" : "lock-closed-outline"}
        size={21}
        color={progress.isComplete ? theme.colors.accent : colors.grayIcon}
        style={{ marginLeft: 10 }}
      />
    </View>
  );
}

function ProfileSectionHeader({
  actionIcon,
  actionLabel,
  onAction,
  title
}: {
  actionIcon?: IconName;
  actionLabel: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <View className="mb-3 mt-5 flex-row items-center justify-between px-1">
      <Text className="text-sm font-black text-content">{title}</Text>
      {onAction ? (
        <QuestActionButton
          accessibilityLabel={`${actionLabel} ${title.toLowerCase()}`}
          className="w-40"
          completedLabel="Opening shop"
          icon={actionIcon ?? "create-outline"}
          label={actionLabel}
          mode="tap"
          onAction={onAction}
          size="compact"
        />
      ) : (
        <Text className="text-xs font-bold text-content-muted">{actionLabel}</Text>
      )}
    </View>
  );
}
