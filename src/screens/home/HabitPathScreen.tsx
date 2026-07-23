import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ResourceBar } from "../../components/ResourceBar";
import { QuestActionButton } from "../../components/QuestActionButton";
import { colors } from "../../constants/colors";
import { useGameActions, useGameHabits, useGameSync } from "../../contexts/appContext";
import { shadows } from "../../styles/shadows";
import type { AdventureNode, AdventureNodeStatus, AdventureSection } from "../../types/app";
import {
  getNodeStatus,
  getSectionCompletedCount,
  isSectionComplete
} from "../../utility/adventurePath";

type HabitPathScreenProps = {
  onBack: () => void;
  onDailyCheckInPress: () => void;
};

export function HabitPathScreen({ onBack, onDailyCheckInPress }: HabitPathScreenProps) {
  const { activeHabit } = useGameHabits();
  const { isOnline, mutationInFlight, todayDateKey } = useGameSync();
  const { claimChapterReward } = useGameActions();
  const actionsDisabled = !isOnline || mutationInFlight !== null;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-5 pb-28 pt-3"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={{ minHeight: 0 }}
    >
      <ResourceBar onDailyCheckInPress={onDailyCheckInPress} />
      <View className="mt-5 flex-row items-center">
        <TouchableOpacity
          className="h-10 w-10 items-center justify-center rounded-card bg-surface-card"
          style={shadows.card}
          activeOpacity={0.82}
          accessibilityLabel="Back to Home"
          accessibilityRole="button"
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={21} color={colors.ink} />
        </TouchableOpacity>
        <View className="ml-3 flex-1">
          <Text className="text-xs font-extrabold uppercase text-content-muted">{activeHabit.label}</Text>
          <Text className="mt-1 text-2xl font-black text-content">Adventure Path</Text>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-card bg-primary-soft">
          <Ionicons name={activeHabit.icon} size={23} color={colors.blueDark} />
        </View>
      </View>

      <View className="mt-5 overflow-hidden rounded-card border border-line bg-surface-card" style={shadows.card}>
        {activeHabit.sections.map((section, index) => (
          <ChapterSection
            key={section.id}
            section={section}
            isLast={index === activeHabit.sections.length - 1}
            completedCount={getSectionCompletedCount(activeHabit, section.id)}
            isComplete={isSectionComplete(activeHabit, section.id)}
            isClaimed={activeHabit.claimedChapterRewardIds.includes(section.id)}
            getStatus={(nodeId) => getNodeStatus(activeHabit, nodeId, todayDateKey)}
            actionsDisabled={actionsDisabled}
            unavailableLabel={!isOnline ? "Reconnect to claim" : "Syncing trail…"}
            onClaim={() => {
              void claimChapterReward(activeHabit.id, section.id).catch(() => undefined);
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function ChapterSection({
  section,
  isLast,
  completedCount,
  isComplete,
  isClaimed,
  actionsDisabled,
  unavailableLabel,
  getStatus,
  onClaim
}: {
  section: AdventureSection;
  isLast: boolean;
  completedCount: number;
  isComplete: boolean;
  isClaimed: boolean;
  actionsDisabled: boolean;
  unavailableLabel: string;
  getStatus: (nodeId: string) => AdventureNodeStatus;
  onClaim: () => void;
}) {
  return (
    <View className={isLast ? "" : "border-b border-line"}>
      <View className="bg-surface-section px-4 py-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-micro font-extrabold uppercase text-primary-strong">
              Chapter {section.order}
            </Text>
            <Text className="mt-1 text-lg font-black text-content">{section.title}</Text>
          </View>
          <Text className="text-xs font-black text-content-muted">
            {completedCount}/{section.nodes.length}
          </Text>
        </View>
        <Text className="mt-2 text-xs font-semibold leading-5 text-content-muted">
          {section.description}
        </Text>
      </View>

      <View className="px-4 py-2">
        {section.nodes.map((node, index) => (
          <PathNodeRow
            key={node.id}
            node={node}
            status={getStatus(node.id)}
            isLast={index === section.nodes.length - 1}
          />
        ))}

        <View
          className={`mb-3 mt-1 rounded-card border p-3 ${
            isClaimed
              ? "border-line-success bg-surface-green"
              : isComplete
                ? "border-line-reward bg-canvas-cream"
                : "border-line bg-surface-disabled"
          }`}
        >
          <View className="flex-row items-center">
            <View
              className={`h-10 w-10 items-center justify-center rounded-card ${
                isComplete ? "bg-line-reward" : "bg-line-locked"
              }`}
            >
              <Ionicons
                name={isClaimed ? "checkmark" : isComplete ? "gift" : "lock-closed"}
                size={20}
                color={isClaimed ? colors.green : isComplete ? colors.gold : colors.grayIcon}
              />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm font-black text-content">Chapter Reward</Text>
              <Text className="mt-1 text-xs font-semibold text-content-muted">
                {section.reward.coins} coins | {section.reward.xp} XP
              </Text>
            </View>
          </View>
          <QuestActionButton
            accessibilityLabel={`${isClaimed ? "Claimed" : isComplete ? "Claim" : "Locked"} ${section.title} reward`}
            className="mt-3"
            completed={isClaimed}
            completedLabel="Reward claimed"
            disabled={!isComplete || isClaimed || actionsDisabled}
            icon={isComplete ? "gift" : "lock-closed"}
            label={isComplete ? (actionsDisabled ? unavailableLabel : "Claim chapter reward") : "Reward locked"}
            mode="tap"
            onAction={onClaim}
          />
        </View>
      </View>
    </View>
  );
}

function PathNodeRow({
  node,
  status,
  isLast
}: {
  node: AdventureNode;
  status: AdventureNodeStatus;
  isLast: boolean;
}) {
  const isDone = status === "done";
  const isActive = status === "active";

  return (
    <View className={`flex-row ${isLast ? "" : "border-b border-line-subtle"}`}>
      <View className="w-10 items-center py-3">
        <View
          className={`h-8 w-8 items-center justify-center rounded-pill border-2 ${
            isDone
              ? "border-success bg-success"
              : isActive
                ? "border-primary bg-primary"
                : "border-line-muted bg-surface-muted"
          }`}
        >
          {isDone ? (
            <Ionicons name="checkmark" size={16} color="white" />
          ) : isActive ? (
            <Text className="text-xs font-black text-white">{node.day}</Text>
          ) : (
            <Ionicons name="lock-closed" size={13} color={colors.grayIcon} />
          )}
        </View>
      </View>
      <View className="min-h-quest-node flex-1 flex-row items-center py-2 pl-2">
        <View className="h-9 w-9 items-center justify-center rounded-card bg-surface-muted">
          <Ionicons
            name={isActive || isDone ? node.icon : "lock-closed"}
            size={18}
            color={isDone ? colors.green : isActive ? colors.blueDark : colors.grayIcon}
          />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-sm font-black text-content">{node.title}</Text>
          <Text className="mt-1 text-xs font-semibold text-content-muted">Day {node.day}</Text>
        </View>
        {isActive ? <Text className="text-xs font-black text-primary-strong">Today</Text> : null}
      </View>
    </View>
  );
}
