import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../constants/colors";
import { images } from "../../constants/images";
import {
  equipmentAttributes,
  loadoutSlots,
  profileBadges,
  type ProfileBadgeId
} from "../../constants/profile";
import { useAppState } from "../../contexts/appContext";
import { useScreenContentWidth } from "../../hooks/useScreenContentWidth";
import { shadows } from "../../styles/shadows";
import type { IconName } from "../../types/app";
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

function formatItemName(itemId: string) {
  return itemId
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatClassName(classId: string) {
  return classId.charAt(0).toUpperCase() + classId.slice(1);
}

export function ProfileScreen() {
  const { dailyStreak, habitList, longestStreak, profile, setActiveTab } = useAppState();
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
  const attributeTotals = getEquipmentAttributeTotals(profile.equippedItemIds);
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
    { icon: "ribbon-outline", label: "Badges earned", value: `${unlockedBadgeIds.size}` }
  ];

  return (
    <ScrollView
      contentContainerClassName="pb-28 pt-3"
      contentContainerStyle={{ width: "100%" }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
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
          onPress={() => setActiveTab("more")}
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
          <Image
            source={avatarSource}
            resizeMode="cover"
            style={{ height: "100%", width: "100%" }}
            accessibilityLabel={`${profile.name}, ${profile.avatarClassId} avatar`}
            accessibilityRole="image"
          />
          <TouchableOpacity
            className="absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-card bg-surface-card"
            activeOpacity={0.82}
            accessibilityLabel="Edit avatar"
            accessibilityRole="button"
            onPress={() => setActiveTab("shop")}
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
        actionLabel="Edit"
        onAction={() => setActiveTab("shop")}
      />
      <View
        className="rounded-card border border-line bg-surface-card px-2 py-3"
        style={shadows.card}
      >
        {[loadoutSlots.slice(0, 4), loadoutSlots.slice(4)].map((row, rowIndex) => (
          <View
            key={rowIndex === 0 ? "equipment-row-one" : "equipment-row-two"}
            className={`flex-row ${rowIndex === 1 ? "mt-2 border-t border-line-subtle pt-2" : ""}`}
          >
            {row.map((slot) => {
              const slotIndex = loadoutSlots.indexOf(slot);
              const equippedItemId = profile.equippedItemIds[slotIndex];

              return (
                <View key={slot.label} className="flex-1 items-center px-1 py-1">
                  <View className="h-11 w-11 items-center justify-center rounded-card bg-surface-muted">
                    <Ionicons
                      name={slot.icon}
                      size={21}
                      color={equippedItemId ? colors.blueDark : colors.grayIcon}
                    />
                  </View>
                  <Text className="mt-1 text-micro font-extrabold uppercase text-content-muted">
                    {slot.label}
                  </Text>
                  <Text
                    className="mt-1 w-full text-center text-micro font-bold text-content-subtle"
                    numberOfLines={1}
                  >
                    {equippedItemId ? formatItemName(equippedItemId) : "Empty"}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

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

function ProfileSectionHeader({
  actionLabel,
  onAction,
  title
}: {
  actionLabel: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <View className="mb-3 mt-5 flex-row items-center justify-between px-1">
      <Text className="text-sm font-black text-content">{title}</Text>
      {onAction ? (
        <TouchableOpacity
          activeOpacity={0.82}
          accessibilityLabel={`${actionLabel} ${title.toLowerCase()}`}
          accessibilityRole="button"
          onPress={onAction}
        >
          <Text className="text-xs font-black text-primary-strong">{actionLabel}</Text>
        </TouchableOpacity>
      ) : (
        <Text className="text-xs font-bold text-content-muted">{actionLabel}</Text>
      )}
    </View>
  );
}
