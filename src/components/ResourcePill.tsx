import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { IconName } from "../types/app";

type ResourcePillProps = {
  icon: IconName;
  value: string;
  color: string;
  suffix?: string;
  /** Kept in the public contract so callers can describe the resource type. */
  tone?: "energy" | "streak" | "shield" | "coins";
  accessibilityLabel?: string;
};

export function ResourcePill({
  icon,
  value,
  color,
  suffix,
  tone: _tone,
  accessibilityLabel
}: ResourcePillProps) {
  return (
    <View
      className="min-h-11 flex-row items-center px-2 py-2"
      style={{
        flexShrink: 1,
        flexBasis: "auto",
        minWidth: suffix ? 80 : 44
      }}
      accessible
      accessibilityLabel={accessibilityLabel ?? value}
    >
      <Ionicons name={icon} size={15} color={color} style={{ flexShrink: 0 }} />
      <View
        className={`ml-1 ${suffix ? "justify-center" : "flex-row items-center"}`}
        style={{ flexShrink: 1, minWidth: 0 }}
      >
        <Text
          className="text-sm font-black text-content"
          style={{ flexShrink: 1, fontVariant: ["tabular-nums"] }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
        {suffix ? (
          <Text
            className="text-micro font-bold text-content-muted"
            style={{ flexShrink: 1 }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
