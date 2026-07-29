import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";

import { sounds } from "../constants/audio";
import { colors } from "../constants/colors";
import {
   useGameActions,
  useGameHabits,
  useGameQuests,
  useGameResources,
  useGameSettings,
   useGameSync
} from "../contexts/appContext";
import { useHaptics } from "../hooks/useHaptics";
import { shadows } from "../styles/shadows";
import type { IconName } from "../types/app";
import {
   getDailyQuestSummary,
   getEffectiveHabitTarget
} from "../utility/habitTargets";
import { HabitIconWithStatus } from "./HabitIconWithStatus";
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

   return Math.max(
      0,
      Math.floor((nowMilliseconds - startedAtMilliseconds) / 1000),
   );
}

type ZonedDateTimeParts = {
   year: number;
   month: number;
   day: number;
   hour: number;
   minute: number;
   second: number;
};

function getZonedDateTimeParts(
   date: Date,
   timeZone: string,
): ZonedDateTimeParts {
   const values = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
         timeZone,
         year: "numeric",
         month: "2-digit",
         day: "2-digit",
         hour: "2-digit",
         minute: "2-digit",
         second: "2-digit",
         hourCycle: "h23",
      })
         .formatToParts(date)
         .map((part) => [part.type, part.value]),
   );

   return {
      year: Number(values.year),
      month: Number(values.month),
      day: Number(values.day),
      hour: Number(values.hour),
      minute: Number(values.minute),
      second: Number(values.second),
   };
}

function getTimeZoneOffsetMilliseconds(date: Date, timeZone: string) {
   const parts = getZonedDateTimeParts(date, timeZone);
   const timeAsUtcMilliseconds = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
   );

   return timeAsUtcMilliseconds - date.getTime();
}

function getNextDailyResetMilliseconds(
   nowMilliseconds: number,
   timeZone: string,
) {
   try {
      const currentParts = getZonedDateTimeParts(
         new Date(nowMilliseconds),
         timeZone,
      );
      const nextLocalDateAtUtc = Date.UTC(
         currentParts.year,
         currentParts.month - 1,
         currentParts.day + 1,
      );
      const offsetAtNextMidnight = getTimeZoneOffsetMilliseconds(
         new Date(nextLocalDateAtUtc),
         timeZone,
      );

      return nextLocalDateAtUtc - offsetAtNextMidnight;
   } catch {
      const nextLocalMidnight = new Date(nowMilliseconds);
      nextLocalMidnight.setHours(24, 0, 0, 0);
      return nextLocalMidnight.getTime();
   }
}

function formatDailyResetCooldown(millisecondsRemaining: number) {
   const totalSeconds = Math.max(0, Math.floor(millisecondsRemaining / 1000));

   if (totalSeconds < 60) {
      return `${totalSeconds}s`;
   }

   const totalMinutes = Math.floor(totalSeconds / 60);
   const hours = Math.floor(totalMinutes / 60);
   const minutes = totalMinutes % 60;

   return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

type DailyQuestCardProps = {
   onQuestCompleted?: (details: LootDropDetails) => void;
};

export function DailyQuestCard({ onQuestCompleted }: DailyQuestCardProps) {
   const { activeAdventure, activeHabit } = useGameHabits();
   const { timeZone } = useGameQuests();
   const { energy } = useGameResources();
   const { isOnline, mutationInFlight, serverClockOffsetMs, todayDateKey } =
      useGameSync();
   const { clearSyncError, completeDailyQuest, startDailyQuest } =
      useGameActions();
   const { targetOverrides } = useGameSettings();
   const shortPressSoundPlayer = useAudioPlayer(sounds.shortPressButton, {
      keepAudioSessionActive: true,
   });
   const { medium } = useHaptics();
   const [nowMilliseconds, setNowMilliseconds] = useState(
      () => Date.now() + serverClockOffsetMs,
   );
   const activeLocation = activeAdventure.activeLocation;
   const timedQuestProgress = activeAdventure.timedQuestProgress;
   const completedToday = activeHabit.lastCompletedDateKey === todayDateKey;
   const inProgress =
      activeHabit.activeTimedQuest !== null &&
      activeHabit.activeTimedQuest.startedOn === todayDateKey;
   const statusIcon: IconName | null = completedToday
      ? "checkmark-circle"
      : inProgress
        ? "play-circle-outline"
        : null;
   const statusIconColor = completedToday ? colors.green : colors.gold;

   useEffect(() => {
      shortPressSoundPlayer.loop = false;
      shortPressSoundPlayer.volume = 0.35;
   }, [shortPressSoundPlayer]);

   const playShortPressSound = () => {
      void shortPressSoundPlayer.seekTo(0).catch(() => undefined);
      shortPressSoundPlayer.play();
   };

   useEffect(() => {
      if (!timedQuestProgress && !activeAdventure.completedToday) {
         return;
      }

      setNowMilliseconds(Date.now() + serverClockOffsetMs);
      const interval = setInterval(
         () => setNowMilliseconds(Date.now() + serverClockOffsetMs),
         TIMER_REFRESH_INTERVAL_MILLISECONDS,
      );

      return () => clearInterval(interval);
   }, [
      activeAdventure.completedToday,
      serverClockOffsetMs,
      timedQuestProgress,
   ]);

   if (activeAdventure.completedToday) {
      const completedLocation = activeAdventure.completedTodayLocation;
      const completion = activeHabit.completions.find(
         (record) => record.nodeId === completedLocation?.node.id,
      );
      const cooldown = formatDailyResetCooldown(
         getNextDailyResetMilliseconds(nowMilliseconds, timeZone) -
            nowMilliseconds,
      );

      return (
         <View
            className="mt-4 rounded-card border border-line-success bg-surface-green p-4"
            style={shadows.card}
         >
            <View className="flex-row items-center">
               <View className="h-11 w-11 items-center justify-center rounded-card bg-success-pale">
                  <HabitIconWithStatus
                     habitIcon={activeHabit.icon}
                     mainIconColor={colors.green}
                     statusIcon={statusIcon ?? "checkmark-circle"}
                     statusIconColor={colors.green}
                  />
               </View>
               <View className="ml-3 flex-1">
                  <Text className="text-xs font-extrabold uppercase text-content-green">
                     Daily Quest
                  </Text>
                  <Text className="mt-1 text-lg font-black text-content">
                     Quest complete
                  </Text>
               </View>
               <View
                  className="h-8 items-center justify-center rounded-card border border-line-success bg-success-pale px-2"
                  style={{ minWidth: 78 }}
                  accessible
                  accessibilityLabel="Quest cleared"
                  accessibilityRole="text"
               >
                  <Text className="text-sm font-black text-content-green">Cleared</Text>
               </View>
            </View>
            {completion ? (
               <View className="mt-2 flex-row justify-between items-start">
                  <Text className="text-sm font-semibold leading-5 text-content-green-deep">
                     Until next quest: {cooldown}
                  </Text>
                  <View className="flex-row items-center">
                     <Text className="text-xs font-black text-reward-earned">
                        +{completion.reward.coins} coins
                     </Text>
                     <Text className="ml-4 text-xs font-bold text-content-green">
                        +{completion.reward.xp} XP
                     </Text>
                  </View>
               </View>
            ) : null}
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
            <Text className="mt-3 text-xl font-black text-content">
               Adventure complete
            </Text>
            <Text className="mt-1 text-sm font-semibold leading-5 text-content-muted">
               You reached the end of every available chapter for{" "}
               {activeHabit.label}.
            </Text>
         </View>
      );
   }

   const { node, section } = activeLocation;
   const isTimedQuest = node.questType === "timed";
   const override = targetOverrides[activeHabit.id];
   const effectiveTarget = getEffectiveHabitTarget(
      activeHabit.id,
      node,
      override
   );
   const effectiveDurationSeconds = isTimedQuest
      ? effectiveTarget * 60
      : 0;
   const effectiveQuantity = !isTimedQuest ? effectiveTarget : 0;
   const questSummary = getDailyQuestSummary(
      activeHabit.id,
      node.title,
      effectiveTarget
   );
   const actionUnavailable = !isOnline || mutationInFlight !== null;
   const hasEnoughEnergy = energy.current >= node.energyCost;
   const canStartOrCompleteQuest = hasEnoughEnergy && !actionUnavailable;
   const elapsedSeconds =
      isTimedQuest && timedQuestProgress
         ? getElapsedSeconds(timedQuestProgress.startedAt, nowMilliseconds)
         : 0;
   const timerProgressPercent = isTimedQuest
      ? Math.min((elapsedSeconds / effectiveDurationSeconds) * 100, 100)
      : 0;
   const hasReachedTimerTarget =
      isTimedQuest && elapsedSeconds >= effectiveDurationSeconds;
   const unavailableLabel = !isOnline
      ? "Reconnect to continue"
      : mutationInFlight
        ? "Syncing trail…"
        : "Need more energy";
   const completeQuest = async () => {
      clearSyncError();
         medium();
      try {
         const outcome = await completeDailyQuest(activeHabit.id);
         if (outcome.alreadyCompleted || !outcome.lootItem) return;

         const completionDetails: LootDropDetails = {
            coinReward: outcome.coinReward,
            xpReward: outcome.xpReward,
            streak: outcome.streak,
            streakShieldConsumed: outcome.streakShieldConsumed,
            remainingStreakShields: outcome.remainingStreakShields,
            habitLabel: activeHabit.label,
            lootItem: outcome.lootItem,
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
                  Daily Quest
               </Text>
               <Text className="mt-1 text-xl font-black text-content">
                  {node.title}
               </Text>
               <Text className="mt-1 text-xs font-bold text-content-muted">
                  {section.title} | Day {node.day} of {section.nodes.length}
               </Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-card bg-primary-soft">
               <HabitIconWithStatus
                  habitIcon={activeHabit.icon}
                  mainIconColor={colors.blueDark}
                  statusIcon={statusIcon}
                  statusIconColor={statusIconColor}
               />
            </View>
         </View>

         <View className="mt-4 rounded-card bg-surface-panel p-3">
            <Text className="text-sm font-extrabold leading-5 text-content">
               {questSummary}
            </Text>
            <Text className="mt-1 text-xs font-bold text-content-muted">
               {isTimedQuest
                  ? `Timed quest | ${formatTimer(effectiveDurationSeconds)}`
                  : `One-time quest | ${effectiveQuantity} ${node.questType === "one-time" ? node.targetUnit : ""}`}
            </Text>
         </View>

         <View className="mt-3 flex-row items-center">
            <View className="flex-row items-center">
               <Ionicons name="ellipse" size={14} color={colors.gold} />
               <Text className="ml-1 text-xs font-black text-content-gold">
                  {node.reward.coins}
               </Text>
            </View>
            <View className="ml-4 flex-row items-center">
               <Ionicons name="sparkles" size={14} color={colors.green} />
               <Text className="ml-1 text-xs font-black text-content-green">
                  {node.reward.xp} XP
               </Text>
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
                     <Ionicons
                        name="timer-outline"
                        size={18}
                        color={colors.blueDark}
                     />
                     <Text className="ml-2 text-xs font-extrabold uppercase text-content-blue-muted">
                        Quest in progress
                     </Text>
                  </View>
                  <Text
                     className="text-lg font-black text-content"
                     style={{ fontVariant: ["tabular-nums"] }}
                  >
                     {formatTimer(elapsedSeconds)} /{" "}
                     {formatTimer(effectiveDurationSeconds)}
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
                     label={
                        actionUnavailable
                           ? unavailableLabel
                           : "Hold to complete"
                     }
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
                  icon={
                     canStartOrCompleteQuest
                        ? "play"
                        : isOnline
                          ? "flash-outline"
                          : "cloud-offline-outline"
                  }
                  label={
                     canStartOrCompleteQuest ? "Start quest" : unavailableLabel
                  }
                  mode="tap"
                  onAction={() => {
                     clearSyncError();
                     medium();
                     void startDailyQuest(activeHabit.id).catch(
                        () => undefined,
                     );
                  }}
                  onPressSound={playShortPressSound}
               />
            )
         ) : (
            <QuestActionButton
               accessibilityLabel={`Complete ${node.title} quest`}
               className="mt-4"
               completedLabel="Quest complete"
               disabled={!canStartOrCompleteQuest}
               icon={
                  canStartOrCompleteQuest
                     ? "checkmark-circle"
                     : isOnline
                       ? "flash-outline"
                       : "cloud-offline-outline"
               }
               label={
                  canStartOrCompleteQuest
                     ? "Hold to complete"
                     : unavailableLabel
               }
               mode="hold"
               onAction={completeQuest}
            />
         )}
      </View>
   );
}
