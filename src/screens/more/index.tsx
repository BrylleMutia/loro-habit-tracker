import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  QuestCelebrationModal,
  type CelebrationVariant
} from "../../components/QuestCelebrationModal";
import { QuestActionButton } from "../../components/QuestActionButton";
import { ResourceBar } from "../../components/ResourceBar";
import { colors } from "../../constants/colors";
import { shadows } from "../../styles/shadows";
import type { IconName } from "../../types/app";
import { ActionButtonPrototypes } from "./ActionButtonPrototypes";

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

type MoreScreenProps = {
  onDailyCheckInPress: () => void;
};

export function MoreScreen({ onDailyCheckInPress }: MoreScreenProps) {
  const [activeSample, setActiveSample] = useState<CelebrationVariant | null>(null);

  return (
    <>
      <ScrollView
        contentContainerClassName="px-5 pb-28 pt-3"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <ResourceBar onDailyCheckInPress={onDailyCheckInPress} />
        <View className="mt-5">
          <Text className="text-xs font-extrabold uppercase text-primary-strong">Prototype gallery</Text>
          <Text className="mt-1 text-3xl font-black text-content">Celebration Lab</Text>
          <Text className="mt-2 text-sm font-semibold leading-5 text-content-muted">
            Three moods for the moment a Daily Quest is completed.
          </Text>
        </View>

        <View className="mt-5">
          {celebrationSamples.map((sample) => (
            <View
              key={sample.id}
              className="mb-3 rounded-card border border-line bg-surface-card p-4"
              style={shadows.card}
            >
              <View className="flex-row items-center">
                <View
                  className="h-12 w-12 items-center justify-center rounded-card"
                  style={{ backgroundColor: sample.iconBackground }}
                >
                  <Ionicons name={sample.icon} size={24} color={sample.iconColor} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-micro font-extrabold text-content-icon">
                    OPTION {sample.number}
                  </Text>
                  <Text className="mt-1 text-lg font-black text-content">{sample.title}</Text>
                  <Text className="mt-1 text-xs font-semibold leading-4 text-content-muted">
                    {sample.tone}
                  </Text>
                </View>
              </View>
              <QuestActionButton
                accessibilityLabel={`Preview ${sample.title}`}
                className="mt-3"
                completedLabel="Opening preview"
                icon="play"
                label={`Preview ${sample.title}`}
                mode="tap"
                onAction={() => setActiveSample(sample.id)}
                size="compact"
              />
            </View>
          ))}
        </View>

        <View className="mt-6 border-t border-line pt-6">
          <Text className="text-xs font-extrabold uppercase text-primary-strong">
            Interaction controls
          </Text>
          <Text className="mt-1 text-3xl font-black text-content">Button Lab</Text>
        </View>
        <ActionButtonPrototypes />
      </ScrollView>

      <QuestCelebrationModal variant={activeSample} onClose={() => setActiveSample(null)} />
    </>
  );
}
