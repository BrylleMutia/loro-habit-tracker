import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AdventurePathPreview } from "../../components/AdventurePathPreview";
import { DailyQuestCard } from "../../components/DailyQuestCard";
import { PixelParrot } from "../../components/PixelParrot";
import {
  QuestCelebrationModal,
  type LootDropDetails
} from "../../components/QuestCelebrationModal";
import { ResourceBar } from "../../components/ResourceBar";
import { colors } from "../../constants/colors";
import { images } from "../../constants/images";
import { useAppState } from "../../contexts/appContext";
import { shadows } from "../../styles/shadows";
import { HabitPathScreen } from "./HabitPathScreen";

export function HomeScreen() {
  const [isPathVisible, setIsPathVisible] = useState(false);
  const [lootDropDetails, setLootDropDetails] = useState<LootDropDetails | null>(null);

  if (isPathVisible) {
    return <HabitPathScreen onBack={() => setIsPathVisible(false)} />;
  }

  return (
    <>
      <ScrollView
        contentContainerClassName="px-5 pb-28 pt-3"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <ResourceBar />
        <HeroGreeting />
        <ActiveHabitCard />
        <DailyQuestCard onQuestCompleted={setLootDropDetails} />
        <AdventurePathPreview onViewPath={() => setIsPathVisible(true)} />
      </ScrollView>

      <QuestCelebrationModal
        variant={lootDropDetails ? "loot-drop" : null}
        lootDropDetails={lootDropDetails ?? undefined}
        onClose={() => setLootDropDetails(null)}
      />
    </>
  );
}

function HeroGreeting() {
  const { activeHabit, profile } = useAppState();

  return (
    <View className="mt-5 overflow-hidden rounded-lg border border-[#D8EAF4] bg-[#DFF5FF]">
      <View className="min-h-[210px] pt-4">
        <Image
          source={images.headerBackground}
          resizeMode="cover"
          className="absolute inset-0 h-full w-full"
        />
        <View className="absolute bottom-5 right-1">
          <PixelParrot size="lg" mirrorX />
        </View>
        <View className="pl-10 pt-5">
          <Text className="text-base font-bold text-[#0B2551]">Good morning,</Text>
          <View className="mt-1 flex-row items-center">
            <Text className="text-3xl font-black text-[#0B2551]">{profile.name}!</Text>
            <Ionicons name="partly-sunny" size={25} color={colors.gold} style={{ marginLeft: 8 }} />
          </View>

          <View
            className="mt-8 max-w-[170px] rounded-lg border border-[#E6EDF2] bg-[#FFFDF7] p-3"
            style={shadows.card}
          >
            <Text className="text-sm font-semibold leading-5 text-[#0B2551]">
              {activeHabit.dailyPrompt}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ActiveHabitCard() {
  const {
    activeHabit,
    activeHabitId,
    activeAdventure,
    activeHabitProgressPercent,
    habitList,
    setActiveHabit
  } = useAppState();

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
          <Ionicons name={activeHabit.icon} size={24} color={colors.red} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-3xl font-black text-[#111D35]">{activeHabit.label}</Text>
          <Text className="mt-1 text-xs font-bold text-[#6D7890]">
            {activeAdventure.focusLocation
              ? `${activeAdventure.focusLocation.section.title} | Day ${activeAdventure.focusLocation.node.day} of ${activeAdventure.focusLocation.section.nodes.length}`
              : "All available chapters complete"}
          </Text>
        </View>
        <TouchableOpacity className="h-9 w-9 items-center justify-center rounded-lg bg-[#F3F7F8]" activeOpacity={0.82}>
          <Ionicons name="chevron-down" size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8EEF2]">
        <View
          className="h-full rounded-full bg-[#56A6F7]"
          style={{ width: `${activeHabitProgressPercent}%` }}
        />
      </View>

      <View className="mt-4 flex-row flex-wrap">
        {habitList.map((habit) => {
          const isActive = habit.id === activeHabitId;

          return (
            <TouchableOpacity
              key={habit.id}
              className={`mb-2 mr-2 h-9 flex-row items-center rounded-full border px-3 ${
                isActive ? "border-[#56A6F7] bg-[#E7F4FF]" : "border-[#E6EDF2] bg-white"
              }`}
              activeOpacity={0.82}
              accessibilityLabel={`Show ${habit.label} habit`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={() => setActiveHabit(habit.id)}
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
