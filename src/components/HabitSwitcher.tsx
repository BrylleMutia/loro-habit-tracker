import { ScrollView, Text, TouchableOpacity } from "react-native";

import { colors } from "../constants/colors";
import {
  useGameActions,
  useGameHabits,
  useGameSync
} from "../contexts/appContext";
import { useHaptics } from "../hooks/useHaptics";
import type { IconName } from "../types/app";
import { HabitIconWithStatus } from "./HabitIconWithStatus";

export function HabitSwitcher() {
  const { activeHabitId, habitList } = useGameHabits();
  const { setActiveHabit } = useGameActions();
  const { todayDateKey } = useGameSync();
  const { selection } = useHaptics();

  return (
    <ScrollView
      horizontal
      contentContainerClassName="gap-2 pr-5"
      showsHorizontalScrollIndicator={false}
    >
      {habitList.map((habit) => {
        const isActive = habit.id === activeHabitId;
        const completedToday = habit.lastCompletedDateKey === todayDateKey;
        const inProgress =
          habit.activeTimedQuest !== null &&
          habit.activeTimedQuest.startedOn === todayDateKey;
        const statusLabel = completedToday
          ? "completed today"
          : inProgress
            ? "timed quest in progress"
            : null;
        const statusIcon: IconName | null = completedToday
          ? "checkmark-circle"
          : inProgress
            ? "play-circle-outline"
            : null;
        const statusIconColor = completedToday ? colors.green : colors.gold;

        return (
          <TouchableOpacity
            key={habit.id}
            className={`h-11 flex-row items-center rounded-card border px-3 ${
              isActive
                ? "border-primary-strong bg-primary"
                : "border-line-primary bg-primary-soft"
            }`}
            activeOpacity={0.82}
            accessibilityLabel={`${habit.label}${statusLabel ? `, ${statusLabel}` : ""}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              if (isActive) return;

              selection();
              setActiveHabit(habit.id);
            }}
          >
            <HabitIconWithStatus
              habitIcon={habit.icon}
              iconSize={18}
              containerClassName="relative h-6 w-6 items-center justify-center"
              mainIconColor={isActive ? colors.card : colors.blueDark}
              statusIcon={statusIcon}
              statusIconColor={statusIconColor}
            />
            <Text
              className={`ml-2 text-xs font-black ${
                isActive ? "text-white" : "text-primary-strong"
              }`}
              numberOfLines={1}
            >
              {habit.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
