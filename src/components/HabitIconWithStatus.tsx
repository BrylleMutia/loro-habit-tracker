import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { IconName } from "../types/app";

type HabitIconWithStatusProps = {
  habitIcon: IconName;
  iconSize?: number;
  containerClassName?: string;
  mainIconColor: string;
  statusIcon: IconName | null;
  statusIconColor: string;
};

export function HabitIconWithStatus({
  habitIcon,
  iconSize = 23,
  containerClassName = "relative h-7 w-7 items-center justify-center",
  mainIconColor,
  statusIcon,
  statusIconColor
}: HabitIconWithStatusProps) {
  return (
    <View className={containerClassName}>
      <Ionicons name={habitIcon} size={iconSize} color={mainIconColor} />
      {statusIcon ? (
        <View
          className="absolute -bottom-1 -right-1 h-4 w-4 items-center justify-center rounded-full border border-surface-card bg-surface-card"
          pointerEvents="none"
        >
          <Ionicons name={statusIcon} size={14} color={statusIconColor} />
        </View>
      ) : null}
    </View>
  );
}
