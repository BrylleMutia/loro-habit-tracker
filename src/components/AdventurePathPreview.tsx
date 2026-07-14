import { Fragment } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { useAppState } from "../contexts/appContext";
import { shadows } from "../styles/shadows";
import type { AdventureNodeStatus } from "../types/app";

type AdventurePathPreviewProps = {
  onViewPath: () => void;
};

export function AdventurePathPreview({ onViewPath }: AdventurePathPreviewProps) {
  const { activeAdventure } = useAppState();
  const section = activeAdventure.focusLocation?.section;

  if (!section) {
    return null;
  }

  return (
    <View className="mt-4 rounded-lg border border-[#E6EDF2] bg-[#FFFDF7] p-4" style={shadows.card}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-extrabold uppercase text-[#6D7890]">Adventure Path</Text>
          <Text className="mt-1 text-lg font-black text-[#0B2551]">{section.title}</Text>
        </View>
        <TouchableOpacity
          className="h-9 flex-row items-center rounded-lg bg-[#E7F4FF] px-3"
          activeOpacity={0.82}
          accessibilityLabel="View full adventure path"
          accessibilityRole="button"
          onPress={onViewPath}
        >
          <Text className="text-xs font-black text-[#2F80ED]">View Path</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.blueDark} />
        </TouchableOpacity>
      </View>

      <View className="mt-4 flex-row items-start">
        {activeAdventure.previewNodes.map((preview, index) => (
          <Fragment key={preview.node.id}>
            <PreviewNode
              day={preview.node.day}
              title={preview.node.title}
              status={preview.status}
            />
            {index < activeAdventure.previewNodes.length - 1 ? (
              <View
                className={`mt-5 h-[2px] flex-1 ${
                  preview.status === "done" ? "bg-[#56C878]" : "bg-[#D8E1E8]"
                }`}
              />
            ) : null}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

function PreviewNode({
  day,
  title,
  status
}: {
  day: number;
  title: string;
  status: AdventureNodeStatus;
}) {
  const isDone = status === "done";
  const isActive = status === "active";

  return (
    <View className="w-[74px] items-center">
      <View
        className={`h-10 w-10 items-center justify-center rounded-full border-2 ${
          isDone
            ? "border-[#56C878] bg-[#56C878]"
            : isActive
              ? "border-[#56A6F7] bg-[#56A6F7]"
              : "border-[#C9D2DC] bg-[#F3F7F8]"
        }`}
      >
        {isDone ? (
          <Ionicons name="checkmark" size={18} color="white" />
        ) : isActive ? (
          <Ionicons name="flag" size={17} color="white" />
        ) : (
          <Ionicons name="lock-closed" size={15} color={colors.grayIcon} />
        )}
      </View>
      <Text className="mt-2 text-[10px] font-extrabold uppercase text-[#7E899B]">Day {day}</Text>
      <Text className="mt-1 text-center text-xs font-bold text-[#0B2551]" numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
}
