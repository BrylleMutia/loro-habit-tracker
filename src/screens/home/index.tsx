import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { PixelHeaderBackground } from "../../components/PixelHeaderBackground";
import { PixelParrot } from "../../components/PixelParrot";
import { ResourceBar } from "../../components/ResourceBar";
import { colors } from "../../constants/colors";
import { habitChips, pathItems, userStats, type HabitId, type PathItem } from "../../constants/home";
import { shadows } from "../../styles/shadows";

export function HomeScreen() {
  const [selectedHabit, setSelectedHabit] = useState<HabitId>("sketching");

  return (
    <ScrollView contentContainerClassName="px-5 pb-28 pt-3" showsVerticalScrollIndicator={false}>
      <ResourceBar />
      <HeroGreeting />
      <ActiveHabitCard selectedHabit={selectedHabit} onSelectHabit={setSelectedHabit} />
      <TodayPath />
    </ScrollView>
  );
}

function HeroGreeting() {
  return (
    <View className="mt-5 overflow-hidden rounded-lg border border-[#D8EAF4] bg-[#DFF5FF]">
      <View className="absolute left-0 right-0 top-0 h-full">
        <PixelHeaderBackground />
      </View>

      <View className="min-h-[210px] px-4 pb-4 pt-4">
        <Text className="text-base font-bold text-[#0B2551]">Good morning,</Text>
        <View className="mt-1 flex-row items-center">
          <Text className="text-3xl font-black text-[#0B2551]">{userStats.name}!</Text>
          <Ionicons name="partly-sunny" size={25} color={colors.gold} style={{ marginLeft: 8 }} />
        </View>

        <View className="mt-8 flex-row items-end justify-between">
          <View className="max-w-[155px] rounded-lg border border-[#E6EDF2] bg-[#FFFDF7] p-3" style={shadows.card}>
            <Text className="text-sm font-semibold leading-5 text-[#0B2551]">
              Let's sketch something awesome today!
            </Text>
          </View>
          <View className="mr-4">
            <PixelParrot size="lg" />
          </View>
        </View>
      </View>
    </View>
  );
}

function ActiveHabitCard({
  selectedHabit,
  onSelectHabit
}: {
  selectedHabit: HabitId;
  onSelectHabit: (habit: HabitId) => void;
}) {
  return (
    <View className="-mt-2 rounded-lg border border-[#E6EDF2] bg-[#FFFDF7] p-4" style={shadows.card}>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-extrabold uppercase tracking-wide text-[#6D7890]">Active Habit</Text>
        <TouchableOpacity activeOpacity={0.82}>
          <Text className="text-xs font-extrabold text-[#2F80ED]">Manage</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-3 flex-row items-center">
        <View className="h-12 w-12 items-center justify-center rounded-lg border border-[#FFE2A8] bg-[#FFF3D6]">
          <Ionicons name="pencil" size={24} color={colors.red} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-3xl font-black text-[#111D35]">{userStats.activeHabit}</Text>
        </View>
        <TouchableOpacity className="h-9 w-9 items-center justify-center rounded-lg bg-[#F3F7F8]" activeOpacity={0.82}>
          <Ionicons name="chevron-down" size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View className="mt-4 flex-row">
        {habitChips.map((habit) => {
          const isActive = habit.id === selectedHabit;

          return (
            <TouchableOpacity
              key={habit.id}
              className={`mr-2 h-9 flex-row items-center rounded-full border px-3 ${
                isActive ? "border-[#56A6F7] bg-[#E7F4FF]" : "border-[#E6EDF2] bg-white"
              }`}
              activeOpacity={0.82}
              onPress={() => onSelectHabit(habit.id)}
            >
              <Ionicons name={habit.icon} size={15} color={isActive ? colors.blueDark : colors.muted} />
              <Text className={`ml-1 text-xs font-bold ${isActive ? "text-[#2F80ED]" : "text-[#6D7890]"}`}>
                {habit.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function TodayPath() {
  return (
    <View className="mt-4 rounded-lg border border-[#E6EDF2] bg-[#FFFDF7] p-4" style={shadows.card}>
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-black text-[#0B2551]">Today's Path</Text>
        <Text className="text-xs font-extrabold text-[#6D7890]">{userStats.currentDay}</Text>
      </View>

      <View className="mt-4">
        {pathItems.map((item, index) => (
          <PathRow key={item.id} item={item} step={index + 1} isLast={index === pathItems.length - 1} />
        ))}
      </View>
    </View>
  );
}

function PathRow({ item, step, isLast }: { item: PathItem; step: number; isLast: boolean }) {
  const isDone = item.status === "done";
  const isActive = item.status === "active";
  const isLocked = item.status === "locked";
  const isBonus = item.status === "bonus";

  return (
    <View className={`flex-row ${isLast ? "" : "mb-3"}`}>
      <View className="w-10 items-center">
        <View
          className={`z-10 h-8 w-8 items-center justify-center rounded-full border-2 ${
            isDone
              ? "border-[#56C878] bg-[#56C878]"
              : isActive
                ? "border-[#56A6F7] bg-[#56A6F7]"
                : isBonus
                  ? "border-[#F5B739] bg-[#FFF3D6]"
                  : "border-[#C9D2DC] bg-[#F3F7F8]"
          }`}
        >
          {isDone ? (
            <Ionicons name="checkmark" size={17} color="white" />
          ) : isBonus ? (
            <Ionicons name="star" size={16} color={colors.gold} />
          ) : (
            <Text className={`text-sm font-black ${isActive ? "text-white" : "text-[#6D7890]"}`}>{step}</Text>
          )}
        </View>
        {!isLast ? <View className="h-14 w-[2px] bg-[#D8E1E8]" /> : null}
      </View>

      <View
        className={`min-h-[62px] flex-1 flex-row items-center rounded-lg border px-3 ${
          isActive
            ? "border-[#56A6F7] bg-[#E7F4FF]"
            : isBonus
              ? "border-[#FFE2A8] bg-[#FFF7EA]"
              : "border-[#E6EDF2] bg-[#F8FBF3]"
        }`}
      >
        <View
          className={`h-10 w-10 items-center justify-center rounded-lg ${
            isLocked ? "bg-[#ECEFF3]" : isBonus ? "bg-[#FFE2A8]" : "bg-white"
          }`}
        >
          <Ionicons
            name={isLocked ? "lock-closed" : item.icon}
            size={21}
            color={isLocked ? colors.grayIcon : isBonus ? colors.gold : isActive ? colors.blueDark : colors.green}
          />
        </View>

        <View className="ml-3 flex-1">
          <Text className="text-sm font-black text-[#0B2551]">{item.title}</Text>
          <Text className="mt-1 text-xs font-semibold text-[#6D7890]">{item.duration}</Text>
        </View>

        {isActive ? (
          <TouchableOpacity className="h-10 flex-row items-center rounded-lg bg-[#56A6F7] px-4" activeOpacity={0.86}>
            <Ionicons name="play" size={15} color="white" />
            <Text className="ml-1 text-sm font-black text-white">Start</Text>
          </TouchableOpacity>
        ) : isDone ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.green} />
        ) : isBonus ? (
          <Ionicons name="chevron-forward" size={22} color={colors.gold} />
        ) : (
          <Ionicons name="lock-closed" size={18} color={colors.grayIcon} />
        )}
      </View>
    </View>
  );
}
