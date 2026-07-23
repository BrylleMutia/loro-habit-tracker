import { memo } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { GuildQuestCompanion } from "./GuildQuestCompanion";
import { getGuildQuestTimeRemaining } from "../utility/guildQuests";
import type { GuildQuestView } from "../utility/guildQuests";

type GuildBriefingCardProps = {
  quest: GuildQuestView;
  now: Date;
  timeZone: string;
};

const GUILD_BRIEFING_CARD_HEIGHT = 280;
const COMPANION_SIZE = 104;

export const GuildBriefingCard = memo(function GuildBriefingCard({
  quest,
  now,
  timeZone,
}: GuildBriefingCardProps) {
  const timeRemaining = getGuildQuestTimeRemaining(quest.period, timeZone, now);
  const message = quest.isClaimed
    ? "Quest complete. The guild remembers your effort."
    : quest.progress.completed
      ? "Your guild reward is ready!"
      : "Quest secured! Keep moving, adventurer.";
  const statusIcon = quest.isClaimed
    ? "checkmark-circle"
    : quest.progress.completed
      ? "gift-outline"
      : "lock-closed";
  const statusColor = quest.isClaimed
    ? colors.green
    : quest.progress.completed
      ? colors.gold
      : colors.blueDark;
  return (
    <View
      accessible
      accessibilityLabel={`Guild quest companion. ${message}`}
      className="mb-2 rounded-card border border-line-hero bg-surface-card p-3"
      style={{ height: GUILD_BRIEFING_CARD_HEIGHT }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-black uppercase text-primary-strong">
          Guild briefing
        </Text>
        <Ionicons name={statusIcon} size={18} color={statusColor} />
      </View>

      <View className="flex-1 items-center justify-center">
        <View
          className="items-center justify-center"
          style={{ width: COMPANION_SIZE, height: COMPANION_SIZE }}
        >
          <GuildQuestCompanion />
        </View>

        <View className="mt-2 w-full rounded-card border border-line-primary bg-surface-blue px-2 py-2">
          <Text className="text-center text-sm font-black leading-5 text-content">
            {message}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-center">
        <Ionicons name="calendar-outline" size={14} color={colors.blueDark} />
        <Text className="ml-1 text-micro font-black text-content-muted">
          Board refreshes in {timeRemaining.label}
        </Text>
      </View>
    </View>
  );
});
