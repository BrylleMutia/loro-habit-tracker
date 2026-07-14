import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { PlayerAvatarPlaceholder } from "../../components/PlayerAvatarPlaceholder";
import { colors } from "../../constants/colors";
import { images } from "../../constants/images";
import { loadoutSlots, profileBadges, type ProfileBadgeId } from "../../constants/profile";
import { useAppState } from "../../contexts/appContext";
import { shadows } from "../../styles/shadows";
import type { IconName } from "../../types/app";

const badgeToneStyles = {
  primary: { background: "bg-primary-soft", border: "border-primary", color: colors.blueDark },
  success: { background: "bg-success-soft", border: "border-success", color: colors.green },
  reward: { background: "bg-reward-soft", border: "border-reward", color: colors.gold },
  danger: { background: "bg-surface-red", border: "border-danger", color: colors.red }
} as const;

function formatItemName(itemId: string) {
  return itemId
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ProfileScreen() {
  const {
    activityLog,
    dailyStreak,
    habitList,
    longestStreak,
    profile,
    setActiveTab
  } = useAppState();
  const completedQuests = habitList.reduce((total, habit) => total + habit.completions.length, 0);
  const activeDays = new Set(
    habitList.flatMap((habit) => habit.completions.map((completion) => completion.completedOn))
  ).size;
  const totalXpEarned = activityLog.reduce((total, entry) => total + entry.xpEarned, 0);
  const completedChapters = habitList.reduce(
    (total, habit) => total + habit.claimedChapterRewardIds.length,
    0
  );
  const xpProgressPercent =
    profile.xpToNextLevel > 0
      ? Math.min((profile.xp / profile.xpToNextLevel) * 100, 100)
      : 0;
  const unlockedBadgeIds = new Set<ProfileBadgeId>([
    "new-adventurer",
    ...(completedQuests > 0 ? (["first-quest"] as ProfileBadgeId[]) : []),
    ...(longestStreak >= 7 ? (["week-streak"] as ProfileBadgeId[]) : []),
    ...(completedChapters > 0 ? (["chapter-one"] as ProfileBadgeId[]) : [])
  ]);

  return (
    <ScrollView
      contentContainerClassName="px-5 pb-28 pt-3"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
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

      <View className="mt-4 overflow-hidden rounded-card">
        <View className="relative h-56 bg-canvas-sky">
          <Image
            source={images.headerBackground}
            resizeMode="cover"
            className="absolute inset-0 h-full w-full opacity-80"
          />

          <View className="absolute bottom-3 left-3 top-3 w-28 rounded-card border border-line bg-surface-card p-3">
            <Text className="text-micro font-extrabold uppercase text-content-muted">Level</Text>
            <View className="mt-2 h-12 w-12 items-center justify-center rounded-card border-2 border-primary bg-primary-soft">
              <Text className="text-xl font-black text-primary-strong">{profile.level}</Text>
            </View>
            <Text className="mt-2 text-micro font-bold text-content-muted">
              {profile.xp} / {profile.xpToNextLevel} XP
            </Text>
            <View className="mt-2 h-2 overflow-hidden rounded-pill bg-line-progress">
              <View
                className="h-full rounded-pill bg-primary"
                style={{ width: `${xpProgressPercent}%` }}
              />
            </View>
            <View className="my-3 h-px bg-line" />
            <Text className="text-micro font-extrabold uppercase text-content-muted">Streak</Text>
            <View className="mt-1 flex-row items-center">
              <Ionicons name="flame" size={24} color={colors.red} />
              <Text className="ml-1 text-2xl font-black text-content">{dailyStreak}</Text>
            </View>
            <Text className="text-micro font-bold text-content-muted">days</Text>
          </View>

          <View className="absolute bottom-0 right-3 items-center">
            <PlayerAvatarPlaceholder />
          </View>
        </View>

        <View className="h-14 flex-row items-center border-t border-line px-4">
          <View className="w-28" />
          <View className="flex-1 items-center">
            <Text className="font-display text-xl font-black text-content">{profile.name}</Text>
            <Text className="text-micro font-bold uppercase text-content-muted">Trail Adventurer</Text>
          </View>
          <TouchableOpacity
            className="h-9 w-9 items-center justify-center rounded-card bg-primary-soft"
            activeOpacity={0.82}
            accessibilityLabel="Open avatar shop"
            accessibilityRole="button"
            onPress={() => setActiveTab("shop")}
          >
            <Ionicons name="pencil" size={16} color={colors.blueDark} />
          </TouchableOpacity>
        </View>
      </View>

      <ProfileSection title="Badges" actionLabel={`${unlockedBadgeIds.size}/${profileBadges.length} earned`}>
        <View className="mt-4 flex-row justify-between">
          {profileBadges.map((badge) => {
            const isUnlocked = unlockedBadgeIds.has(badge.id);
            const tone = badgeToneStyles[badge.tone];

            return (
              <View key={badge.id} className={`w-16 items-center ${isUnlocked ? "" : "opacity-40"}`}>
                <View
                  className={`h-12 w-12 items-center justify-center rounded-pill border-2 ${tone.background} ${tone.border}`}
                >
                  <Ionicons
                    name={isUnlocked ? badge.icon : "lock-closed"}
                    size={21}
                    color={isUnlocked ? tone.color : colors.grayIcon}
                  />
                </View>
                <Text className="mt-2 text-center text-micro font-bold text-content" numberOfLines={2}>
                  {badge.label}
                </Text>
              </View>
            );
          })}
        </View>
      </ProfileSection>

      <ProfileSection
        title="Loadout"
        actionLabel="Edit"
        onAction={() => setActiveTab("shop")}
      >
        <View className="mt-3 flex-row flex-wrap">
          {loadoutSlots.map((slot, index) => {
            const equippedItemId = profile.equippedItemIds[index];

            return (
              <View
                key={slot.label}
                className={`w-1/4 items-center px-1 py-3 ${index >= 4 ? "border-t border-line-subtle" : ""}`}
              >
                <Text className="text-micro font-extrabold uppercase text-content-muted">
                  {slot.label}
                </Text>
                <View className="mt-2 h-10 w-10 items-center justify-center rounded-card bg-surface-muted">
                  <Ionicons name={slot.icon} size={21} color={colors.grayIcon} />
                </View>
                <Text className="mt-1 text-center text-micro font-bold text-content-subtle" numberOfLines={1}>
                  {equippedItemId ? formatItemName(equippedItemId) : "Empty"}
                </Text>
              </View>
            );
          })}
        </View>
      </ProfileSection>

      <ProfileSection title="Habit Stats" actionLabel="All time">
        <View className="mt-4 flex-row">
          <ProfileMetric label="Quests" value={completedQuests.toString()} icon="checkmark-circle" />
          <ProfileMetric label="Active days" value={activeDays.toString()} icon="calendar" hasDivider />
          <ProfileMetric
            label="Best streak"
            value={`${longestStreak}d`}
            icon="flame"
            hasDivider
          />
        </View>
        <View className="-mb-4 -mx-4 mt-4 flex-row items-center border-t border-line-primary bg-primary-soft px-4 py-3">
          <Ionicons name="sparkles" size={18} color={colors.blueDark} />
          <Text className="ml-2 flex-1 text-xs font-bold text-content">
            {totalXpEarned} total XP earned across {habitList.length} adventures
          </Text>
        </View>
      </ProfileSection>
    </ScrollView>
  );
}

function ProfileSection({
  actionLabel,
  children,
  onAction,
  title
}: {
  actionLabel: string;
  children: React.ReactNode;
  onAction?: () => void;
  title: string;
}) {
  return (
    <View
      className="mt-4 rounded-card border border-line bg-surface-card p-4"
      style={shadows.card}
    >
      <View className="flex-row items-center justify-between">
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
      {children}
    </View>
  );
}

function ProfileMetric({
  hasDivider = false,
  icon,
  label,
  value
}: {
  hasDivider?: boolean;
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View className={`flex-1 items-center px-2 ${hasDivider ? "border-l border-line" : ""}`}>
      <Ionicons name={icon} size={18} color={colors.blueDark} />
      <Text className="mt-2 text-lg font-black text-content">{value}</Text>
      <Text className="mt-1 text-center text-micro font-bold uppercase text-content-muted">
        {label}
      </Text>
    </View>
  );
}
