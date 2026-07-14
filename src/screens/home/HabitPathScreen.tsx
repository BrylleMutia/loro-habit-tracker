import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ResourceBar } from "../../components/ResourceBar";
import { colors } from "../../constants/colors";
import { useAppState } from "../../contexts/appContext";
import { shadows } from "../../styles/shadows";
import type { AdventureNode, AdventureNodeStatus, AdventureSection } from "../../types/app";
import {
  getNodeStatus,
  getSectionCompletedCount,
  isSectionComplete
} from "../../utility/adventurePath";

type HabitPathScreenProps = {
  onBack: () => void;
};

export function HabitPathScreen({ onBack }: HabitPathScreenProps) {
  const { activeHabit, claimChapterReward, todayDateKey } = useAppState();

  return (
    <ScrollView
      contentContainerClassName="px-5 pb-28 pt-3"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <ResourceBar />
      <View className="mt-5 flex-row items-center">
        <TouchableOpacity
          className="h-10 w-10 items-center justify-center rounded-lg bg-[#FFFDF7]"
          style={shadows.card}
          activeOpacity={0.82}
          accessibilityLabel="Back to Home"
          accessibilityRole="button"
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={21} color={colors.ink} />
        </TouchableOpacity>
        <View className="ml-3 flex-1">
          <Text className="text-xs font-extrabold uppercase text-[#6D7890]">{activeHabit.label}</Text>
          <Text className="mt-1 text-2xl font-black text-[#0B2551]">Adventure Path</Text>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-lg bg-[#E7F4FF]">
          <Ionicons name={activeHabit.icon} size={23} color={colors.blueDark} />
        </View>
      </View>

      <View className="mt-5 overflow-hidden rounded-lg border border-[#E6EDF2] bg-[#FFFDF7]" style={shadows.card}>
        {activeHabit.sections.map((section, index) => (
          <ChapterSection
            key={section.id}
            section={section}
            isLast={index === activeHabit.sections.length - 1}
            completedCount={getSectionCompletedCount(activeHabit, section.id)}
            isComplete={isSectionComplete(activeHabit, section.id)}
            isClaimed={activeHabit.claimedChapterRewardIds.includes(section.id)}
            getStatus={(nodeId) => getNodeStatus(activeHabit, nodeId, todayDateKey)}
            onClaim={() => claimChapterReward(activeHabit.id, section.id)}
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
  getStatus,
  onClaim
}: {
  section: AdventureSection;
  isLast: boolean;
  completedCount: number;
  isComplete: boolean;
  isClaimed: boolean;
  getStatus: (nodeId: string) => AdventureNodeStatus;
  onClaim: () => void;
}) {
  return (
    <View className={isLast ? "" : "border-b border-[#E6EDF2]"}>
      <View className="bg-[#F5FBFF] px-4 py-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[10px] font-extrabold uppercase text-[#2F80ED]">
              Chapter {section.order}
            </Text>
            <Text className="mt-1 text-lg font-black text-[#0B2551]">{section.title}</Text>
          </View>
          <Text className="text-xs font-black text-[#6D7890]">
            {completedCount}/{section.nodes.length}
          </Text>
        </View>
        <Text className="mt-2 text-xs font-semibold leading-5 text-[#6D7890]">
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

        <TouchableOpacity
          className={`mb-3 mt-1 min-h-[62px] flex-row items-center rounded-lg border px-3 ${
            isClaimed
              ? "border-[#BEE8CA] bg-[#F2FFF5]"
              : isComplete
                ? "border-[#FFE2A8] bg-[#FFF7EA]"
                : "border-[#E6EDF2] bg-[#F6F8F9]"
          }`}
          activeOpacity={0.84}
          accessibilityLabel={`${isClaimed ? "Claimed" : isComplete ? "Claim" : "Locked"} ${section.title} reward`}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isComplete || isClaimed }}
          disabled={!isComplete || isClaimed}
          onPress={onClaim}
        >
          <View
            className={`h-10 w-10 items-center justify-center rounded-lg ${
              isComplete ? "bg-[#FFE2A8]" : "bg-[#E7EBEF]"
            }`}
          >
            <Ionicons
              name={isClaimed ? "checkmark" : isComplete ? "gift" : "lock-closed"}
              size={20}
              color={isClaimed ? colors.green : isComplete ? colors.gold : colors.grayIcon}
            />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-sm font-black text-[#0B2551]">Chapter Reward</Text>
            <Text className="mt-1 text-xs font-semibold text-[#6D7890]">
              {section.reward.coins} coins | {section.reward.xp} XP
            </Text>
          </View>
          <Text className={`text-xs font-black ${isComplete ? "text-[#C78A12]" : "text-[#7E899B]"}`}>
            {isClaimed ? "Claimed" : isComplete ? "Claim" : "Locked"}
          </Text>
        </TouchableOpacity>
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
    <View className={`flex-row ${isLast ? "" : "border-b border-[#EEF2F4]"}`}>
      <View className="w-10 items-center py-3">
        <View
          className={`h-8 w-8 items-center justify-center rounded-full border-2 ${
            isDone
              ? "border-[#56C878] bg-[#56C878]"
              : isActive
                ? "border-[#56A6F7] bg-[#56A6F7]"
                : "border-[#C9D2DC] bg-[#F3F7F8]"
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
      <View className="min-h-[62px] flex-1 flex-row items-center py-2 pl-2">
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-[#F3F7F8]">
          <Ionicons
            name={isActive || isDone ? node.icon : "lock-closed"}
            size={18}
            color={isDone ? colors.green : isActive ? colors.blueDark : colors.grayIcon}
          />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-sm font-black text-[#0B2551]">{node.title}</Text>
          <Text className="mt-1 text-xs font-semibold text-[#6D7890]">Day {node.day}</Text>
        </View>
        {isActive ? <Text className="text-xs font-black text-[#2F80ED]">Today</Text> : null}
      </View>
    </View>
  );
}
