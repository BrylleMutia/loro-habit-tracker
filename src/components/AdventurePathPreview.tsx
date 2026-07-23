import { Fragment } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { useGameHabits } from "../contexts/appContext";
import { shadows } from "../styles/shadows";
import type { AdventureNodeStatus } from "../types/app";
import { QuestActionButton } from "./QuestActionButton";

type AdventurePathPreviewProps = {
  onViewPath: () => void;
};

export function AdventurePathPreview({ onViewPath }: AdventurePathPreviewProps) {
  const { activeAdventure } = useGameHabits();
  const section = activeAdventure.focusLocation?.section;

  if (!section) {
    return null;
  }

  return (
    <View className="mt-4 rounded-card border border-line bg-surface-card p-4" style={shadows.card}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-extrabold uppercase text-content-muted">Adventure Path</Text>
          <Text className="mt-1 text-lg font-black text-content">{section.title}</Text>
        </View>
        <QuestActionButton
          accessibilityLabel="View full adventure path"
          className="w-40"
          completedLabel="Opening path"
          icon="map-outline"
          label="View path"
          mode="tap"
          onAction={onViewPath}
          size="compact"
        />
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
                className={`mt-5 h-path-line flex-1 ${
                  preview.status === "done" ? "bg-success" : "bg-line-disabled"
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
    <View className="w-path-node items-center">
      <View
        className={`h-10 w-10 items-center justify-center rounded-pill border-2 ${
          isDone
            ? "border-success bg-success"
            : isActive
              ? "border-primary bg-primary"
              : "border-line-muted bg-surface-muted"
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
      <Text className="mt-2 text-micro font-extrabold uppercase text-content-subtle">Day {day}</Text>
      <Text className="mt-1 text-center text-xs font-bold text-content" numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
}
