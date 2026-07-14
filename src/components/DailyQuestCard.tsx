import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { useAppState } from "../contexts/appContext";
import { shadows } from "../styles/shadows";
import type { IconName } from "../types/app";
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
    completeDailyQuest,
    energy,
    startDailyQuest
  } = useAppState();
  const [nowMilliseconds, setNowMilliseconds] = useState(() => Date.now());
  const activeLocation = activeAdventure.activeLocation;
  const timedQuestProgress = activeAdventure.timedQuestProgress;

  useEffect(() => {
    if (!timedQuestProgress) {
      return;
    }

    setNowMilliseconds(Date.now());
    const interval = setInterval(
      () => setNowMilliseconds(Date.now()),
      TIMER_REFRESH_INTERVAL_MILLISECONDS
    );

    return () => clearInterval(interval);
  }, [timedQuestProgress]);

  if (activeAdventure.completedToday) {
    const completedLocation = activeAdventure.completedTodayLocation;
    const completion = activeHabit.completions.find(
      (record) => record.nodeId === completedLocation?.node.id
    );

    return (
      <View
        className="mt-4 rounded-lg border border-[#BEE8CA] bg-[#F2FFF5] p-4"
        style={shadows.card}
      >
        <View className="flex-row items-center">
          <View className="h-11 w-11 items-center justify-center rounded-lg bg-[#DDF7E5]">
            <Ionicons name="checkmark-circle" size={25} color={colors.green} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-xs font-extrabold uppercase text-[#4C8060]">
              Today's Quest
            </Text>
            <Text className="mt-1 text-lg font-black text-[#0B2551]">Quest complete</Text>
          </View>
          {completion ? (
            <View className="items-end">
              <Text className="text-xs font-black text-[#C78A12]">
                +{completion.reward.coins} coins
              </Text>
              <Text className="mt-1 text-xs font-bold text-[#4C8060]">
                +{completion.reward.xp} XP
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-3 text-sm font-semibold leading-5 text-[#4C6B5A]">
          Your next quest unlocks tomorrow. You can still complete today's quest for another habit.
        </Text>
      </View>
    );
  }

  if (!activeLocation) {
    return (
      <View
        className="mt-4 rounded-lg border border-[#FFE2A8] bg-[#FFF7EA] p-4"
        style={shadows.card}
      >
        <Ionicons name="trophy" size={28} color={colors.gold} />
        <Text className="mt-3 text-xl font-black text-[#0B2551]">Adventure complete</Text>
        <Text className="mt-1 text-sm font-semibold leading-5 text-[#6D7890]">
          You reached the end of every available chapter for {activeHabit.label}.
        </Text>
      </View>
    );
  }

  const { node, section } = activeLocation;
  const canStartOrCompleteQuest = energy.current >= node.energyCost;
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
  const completeQuest = () => {
    const completionDetails: LootDropDetails = {
      coinReward: node.reward.coins,
      xpReward: node.reward.xp,
      streak: activeHabit.streak + 1,
      habitLabel: activeHabit.label
    };

    completeDailyQuest(activeHabit.id);
    onQuestCompleted?.(completionDetails);
  };

  return (
    <View
      className="mt-4 rounded-lg border border-[#D8EAF4] bg-[#FFFDF7] p-4"
      style={shadows.card}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-extrabold uppercase text-[#6D7890]">
            Today's Quest
          </Text>
          <Text className="mt-1 text-xl font-black text-[#0B2551]">{node.title}</Text>
          <Text className="mt-1 text-xs font-bold text-[#6D7890]">
            {section.title} | Day {node.day} of {section.nodes.length}
          </Text>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-lg bg-[#E7F4FF]">
          <Ionicons name={node.icon} size={23} color={colors.blueDark} />
        </View>
      </View>

      <View className="mt-4 rounded-lg bg-[#F3F8FB] p-3">
        <Text className="text-sm font-extrabold leading-5 text-[#0B2551]">{node.summary}</Text>
        <Text className="mt-1 text-xs font-bold text-[#6D7890]">
          {isTimedQuest
            ? `Timed quest | ${formatTimer(node.targetDurationSeconds)}`
            : `One-time quest | ${node.targetQuantity} ${node.targetUnit}`}
        </Text>
      </View>

      <View className="mt-3 flex-row items-center">
        <View className="flex-row items-center">
          <Ionicons name="ellipse" size={14} color={colors.gold} />
          <Text className="ml-1 text-xs font-black text-[#8A671E]">{node.reward.coins}</Text>
        </View>
        <View className="ml-4 flex-row items-center">
          <Ionicons name="sparkles" size={14} color={colors.green} />
          <Text className="ml-1 text-xs font-black text-[#4C8060]">{node.reward.xp} XP</Text>
        </View>
        <View className="ml-4 flex-row items-center">
          <Ionicons name="flash" size={14} color={colors.blueDark} />
          <Text className="ml-1 text-xs font-black text-[#2F80ED]">
            {node.energyCost === 0 ? "Free" : `${node.energyCost} energy`}
          </Text>
        </View>
      </View>

      {isTimedQuest && timedQuestProgress ? (
        <View className="mt-4 rounded-lg border border-[#CCE5F8] bg-[#F4FAFF] p-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="timer-outline" size={18} color={colors.blueDark} />
              <Text className="ml-2 text-xs font-extrabold uppercase text-[#58728F]">
                Quest in progress
              </Text>
            </View>
            <Text
              className="text-lg font-black text-[#0B2551]"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {formatTimer(elapsedSeconds)} / {formatTimer(node.targetDurationSeconds)}
            </Text>
          </View>
          <View className="mt-3 h-3 overflow-hidden rounded-full bg-[#DCECF7]">
            <View
              className="h-full rounded-full bg-[#56A6F7]"
              style={{ width: `${timerProgressPercent}%` }}
            />
          </View>
          {!hasReachedTimerTarget ? (
            <Text className="mt-2 text-center text-xs font-bold text-[#6D7890]">
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
              icon="checkmark-circle"
              label="Complete quest"
              onPress={completeQuest}
            />
          ) : null
        ) : (
          <QuestActionButton
            accessibilityLabel={`Start ${node.title} quest`}
            disabled={!canStartOrCompleteQuest}
            icon={canStartOrCompleteQuest ? "play" : "flash-outline"}
            label={canStartOrCompleteQuest ? "Start quest" : "Need more energy"}
            onPress={() => startDailyQuest(activeHabit.id)}
          />
        )
      ) : (
        <QuestActionButton
          accessibilityLabel={`Complete ${node.title} quest`}
          disabled={!canStartOrCompleteQuest}
          icon={canStartOrCompleteQuest ? "checkmark-circle" : "flash-outline"}
          label={canStartOrCompleteQuest ? "Complete quest" : "Need more energy"}
          onPress={completeQuest}
        />
      )}
    </View>
  );
}

function QuestActionButton({
  accessibilityLabel,
  disabled = false,
  icon,
  label,
  onPress
}: {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className={`mt-4 h-12 flex-row items-center justify-center rounded-lg ${
        disabled ? "bg-[#D8E1E8]" : "bg-[#56A6F7]"
      }`}
      activeOpacity={0.86}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
    >
      <Ionicons name={icon} size={19} color="white" />
      <Text className="ml-2 text-sm font-black text-white">{label}</Text>
    </TouchableOpacity>
  );
}
