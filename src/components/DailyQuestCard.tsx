import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { useAppState } from "../contexts/appContext";
import { shadows } from "../styles/shadows";
import { QuestActionButton } from "./QuestActionButton";
import type { LootDropDetails } from "./QuestCelebrationModal";

const TIMER_REFRESH_INTERVAL_MILLISECONDS = 1000;

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getElapsedSeconds(startedAt: string, nowMilliseconds: number) {
  const startedAtMilliseconds = Date.parse(startedAt);

  if (!Number.isFinite(startedAtMilliseconds)) {
    return 0;
  }

  return Math.max(0, Math.floor((nowMilliseconds - startedAtMilliseconds) / 1000));
}

type DailyQuestCardProps = {
  onQuestCompleted?: (details: LootDropDetails) => void;
};

export function DailyQuestCard({ onQuestCompleted }: DailyQuestCardProps) {
  const {
    activeAdventure,
    activeHabit,
    clearSyncError,
    completeDailyQuest,
    energy,
    isOnline,
    mutationInFlight,
    serverClockOffsetMs,
    startDailyQuest
  } = useAppState();
  const [nowMilliseconds, setNowMilliseconds] = useState(
    () => Date.now() + serverClockOffsetMs
  );
  const activeLocation = activeAdventure.activeLocation;
  const timedQuestProgress = activeAdventure.timedQuestProgress;

  useEffect(() => {
    if (!timedQuestProgress) {
      return;
    }

    setNowMilliseconds(Date.now() + serverClockOffsetMs);
    const interval = setInterval(
      () => setNowMilliseconds(Date.now() + serverClockOffsetMs),
      TIMER_REFRESH_INTERVAL_MILLISECONDS
    );

    return () => clearInterval(interval);
  }, [serverClockOffsetMs, timedQuestProgress]);

  if (activeAdventure.completedToday) {
    const completedLocation = activeAdventure.completedTodayLocation;
    const completion = activeHabit.completions.find(
      (record) => record.nodeId === completedLocation?.node.id
    );

    return (
      <View
        className="mt-4 rounded-card border border-line-success bg-surface-green p-4"
        style={shadows.card}
      >
        <View className="flex-row items-center">
          <View className="h-11 w-11 items-center justify-center rounded-card bg-success-pale">
            <Ionicons name="checkmark-circle" size={25} color={colors.green} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-xs font-extrabold uppercase text-content-green">
              Today's Quest
            </Text>
            <Text className="mt-1 text-lg font-black text-content">Quest complete</Text>
          </View>
          {completion ? (
            <View className="items-end">
              <Text className="text-xs font-black text-reward-earned">
                +{completion.reward.coins} coins
              </Text>
              <Text className="mt-1 text-xs font-bold text-content-green">
                +{completion.reward.xp} XP
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-3 text-sm font-semibold leading-5 text-content-green-deep">
          Your next quest unlocks tomorrow. You can still complete today's quest for another habit.
        </Text>
      </View>
    );
  }

  if (!activeLocation) {
    return (
      <View
        className="mt-4 rounded-card border border-line-reward bg-canvas-cream p-4"
        style={shadows.card}
      >
        <Ionicons name="trophy" size={28} color={colors.gold} />
        <Text className="mt-3 text-xl font-black text-content">Adventure complete</Text>
        <Text className="mt-1 text-sm font-semibold leading-5 text-content-muted">
          You reached the end of every available chapter for {activeHabit.label}.
        </Text>
      </View>
    );
  }

  const { node, section } = activeLocation;
  const actionUnavailable = !isOnline || mutationInFlight !== null;
  const hasEnoughEnergy = energy.current >= node.energyCost;
  const canStartOrCompleteQuest = hasEnoughEnergy && !actionUnavailable;
  const isTimedQuest = node.questType === "timed";
  const elapsedSeconds =
    isTimedQuest && timedQuestProgress
      ? getElapsedSeconds(timedQuestProgress.startedAt, nowMilliseconds)
      : 0;
  const timerProgressPercent = isTimedQuest
    ? Math.min((elapsedSeconds / node.targetDurationSeconds) * 100, 100)
    : 0;
  const hasReachedTimerTarget =
    isTimedQuest && elapsedSeconds >= node.targetDurationSeconds;
  const unavailableLabel = !isOnline
    ? "Reconnect to continue"
    : mutationInFlight
      ? "Syncing trail…"
      : "Need more energy";
  const completeQuest = async () => {
    clearSyncError();
    try {
      const outcome = await completeDailyQuest(activeHabit.id);
      if (outcome.alreadyCompleted || !outcome.lootItem) return;

      const completionDetails: LootDropDetails = {
        coinReward: outcome.coinReward,
        xpReward: outcome.xpReward,
        streak: outcome.streak,
        habitLabel: activeHabit.label,
        lootItem: outcome.lootItem
      };
      onQuestCompleted?.(completionDetails);
    } catch {
      // The Context keeps the previous snapshot and exposes the retryable error banner.
    }
  };

  return (
    <View
      className="mt-4 rounded-card border border-line-blue bg-surface-card p-4"
      style={shadows.card}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-extrabold uppercase text-content-muted">
            Today's Quest
          </Text>
          <Text className="mt-1 text-xl font-black text-content">{node.title}</Text>
          <Text className="mt-1 text-xs font-bold text-content-muted">
            {section.title} | Day {node.day} of {section.nodes.length}
          </Text>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-card bg-primary-soft">
          <Ionicons name={node.icon} size={23} color={colors.blueDark} />
        </View>
      </View>

      <View className="mt-4 rounded-card bg-surface-panel p-3">
        <Text className="text-sm font-extrabold leading-5 text-content">{node.summary}</Text>
        <Text className="mt-1 text-xs font-bold text-content-muted">
          {isTimedQuest
            ? `Timed quest | ${formatTimer(node.targetDurationSeconds)}`
            : `One-time quest | ${node.targetQuantity} ${node.targetUnit}`}
        </Text>
      </View>

      <View className="mt-3 flex-row items-center">
        <View className="flex-row items-center">
          <Ionicons name="ellipse" size={14} color={colors.gold} />
          <Text className="ml-1 text-xs font-black text-content-gold">{node.reward.coins}</Text>
        </View>
        <View className="ml-4 flex-row items-center">
          <Ionicons name="sparkles" size={14} color={colors.green} />
          <Text className="ml-1 text-xs font-black text-content-green">{node.reward.xp} XP</Text>
        </View>
        <View className="ml-4 flex-row items-center">
          <Ionicons name="flash" size={14} color={colors.blueDark} />
          <Text className="ml-1 text-xs font-black text-primary-strong">
            {node.energyCost === 0 ? "Free" : `${node.energyCost} energy`}
          </Text>
        </View>
      </View>

      {isTimedQuest && timedQuestProgress ? (
        <View className="mt-4 rounded-card border border-line-primary bg-surface-blue p-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="timer-outline" size={18} color={colors.blueDark} />
              <Text className="ml-2 text-xs font-extrabold uppercase text-content-blue-muted">
                Quest in progress
              </Text>
            </View>
            <Text
              className="text-lg font-black text-content"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {formatTimer(elapsedSeconds)} / {formatTimer(node.targetDurationSeconds)}
            </Text>
          </View>
          <View className="mt-3 h-3 overflow-hidden rounded-pill bg-line-timer">
            <View
              className="h-full rounded-pill bg-primary"
              style={{ width: `${timerProgressPercent}%` }}
            />
          </View>
          {!hasReachedTimerTarget ? (
            <Text className="mt-2 text-center text-xs font-bold text-content-muted">
              Stay focused until you reach today's trail marker.
            </Text>
          ) : null}
        </View>
      ) : null}

      {isTimedQuest ? (
        timedQuestProgress ? (
          hasReachedTimerTarget ? (
            <QuestActionButton
              accessibilityLabel={`Complete ${node.title} quest`}
              className="mt-4"
              completedLabel="Quest confirmed"
              disabled={actionUnavailable}
              icon="checkmark-circle"
              label={actionUnavailable ? unavailableLabel : "Hold to complete"}
              mode="hold"
              onAction={completeQuest}
            />
          ) : null
        ) : (
          <QuestActionButton
            accessibilityLabel={`Start ${node.title} quest`}
            className="mt-4"
            completedLabel="Quest started"
            disabled={!canStartOrCompleteQuest}
            icon={canStartOrCompleteQuest ? "play" : isOnline ? "flash-outline" : "cloud-offline-outline"}
            label={canStartOrCompleteQuest ? "Start quest" : unavailableLabel}
            mode="tap"
            onAction={() => {
              clearSyncError();
              void startDailyQuest(activeHabit.id).catch(() => undefined);
            }}
          />
        )
      ) : (
        <QuestActionButton
          accessibilityLabel={`Complete ${node.title} quest`}
          className="mt-4"
          completedLabel="Quest complete"
          disabled={!canStartOrCompleteQuest}
          icon={canStartOrCompleteQuest ? "checkmark-circle" : isOnline ? "flash-outline" : "cloud-offline-outline"}
          label={canStartOrCompleteQuest ? "Hold to complete" : unavailableLabel}
          mode="hold"
          onAction={completeQuest}
        />
      )}
    </View>
  );
}
