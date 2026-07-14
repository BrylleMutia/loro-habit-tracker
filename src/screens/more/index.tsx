import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  QuestCelebrationModal,
  type CelebrationVariant
} from "../../components/QuestCelebrationModal";
import { ResourceBar } from "../../components/ResourceBar";
import { colors } from "../../constants/colors";
import { shadows } from "../../styles/shadows";
import type { IconName } from "../../types/app";

type CelebrationSample = {
  id: CelebrationVariant;
  number: string;
  title: string;
  tone: string;
  icon: IconName;
  iconColor: string;
  iconBackground: string;
};

const celebrationSamples: CelebrationSample[] = [
  {
    id: "trail-stamp",
    number: "01",
    title: "Trail Stamp",
    tone: "Quick, cheerful, and progress-forward",
    icon: "checkmark-circle",
    iconColor: colors.green,
    iconBackground: colors.greenSoft
  },
  {
    id: "loot-drop",
    number: "02",
    title: "Loot Drop",
    tone: "Reward-first with a satisfying reveal",
    icon: "gift",
    iconColor: colors.gold,
    iconBackground: colors.goldSoft
  },
  {
    id: "power-up",
    number: "03",
    title: "Power-Up Portal",
    tone: "Bold, game-like, and momentum-focused",
    icon: "flash",
    iconColor: colors.blueDark,
    iconBackground: colors.blueSoft
  }
];

export function MoreScreen() {
  const [activeSample, setActiveSample] = useState<CelebrationVariant | null>(null);

  return (
    <>
      <ScrollView
        contentContainerClassName="px-5 pb-28 pt-3"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <ResourceBar />
        <View className="mt-5">
          <Text className="text-xs font-extrabold uppercase text-[#2F80ED]">Prototype gallery</Text>
          <Text className="mt-1 text-3xl font-black text-[#0B2551]">Celebration Lab</Text>
          <Text className="mt-2 text-sm font-semibold leading-5 text-[#6D7890]">
            Three moods for the moment a Daily Quest is completed.
          </Text>
        </View>

        <View className="mt-5">
          {celebrationSamples.map((sample) => (
            <View
              key={sample.id}
              className="mb-3 flex-row items-center rounded-lg border border-[#E6EDF2] bg-[#FFFDF7] p-4"
              style={shadows.card}
            >
              <View
                className="h-12 w-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: sample.iconBackground }}
              >
                <Ionicons name={sample.icon} size={24} color={sample.iconColor} />
              </View>
              <View className="ml-3 flex-1 pr-2">
                <Text className="text-[10px] font-extrabold text-[#8792A4]">OPTION {sample.number}</Text>
                <Text className="mt-1 text-lg font-black text-[#0B2551]">{sample.title}</Text>
                <Text className="mt-1 text-xs font-semibold leading-4 text-[#6D7890]">
                  {sample.tone}
                </Text>
              </View>
              <TouchableOpacity
                className="h-10 w-10 items-center justify-center rounded-lg bg-[#E7F4FF]"
                activeOpacity={0.82}
                accessibilityLabel={`Preview ${sample.title}`}
                accessibilityRole="button"
                onPress={() => setActiveSample(sample.id)}
              >
                <Ionicons name="play" size={17} color={colors.blueDark} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <QuestCelebrationModal variant={activeSample} onClose={() => setActiveSample(null)} />
    </>
  );
}
