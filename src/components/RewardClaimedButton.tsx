import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";

type RewardClaimedButtonProps = {
  accessibilityLabel?: string;
  className?: string;
};

/**
 * The non-interactive completion treatment shared by Guild and chapter rewards.
 * It stays visually consistent while making it clear that claiming is finished.
 */
export function RewardClaimedButton({
  accessibilityLabel = "Reward claimed",
  className = ""
}: RewardClaimedButtonProps) {
  return (
    <View
      className={`flex-row items-center justify-center rounded-card border border-line-success bg-success-soft px-3 py-3 ${className}`}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
    >
      <Ionicons name="checkmark-circle" size={18} color={colors.green} />
      <Text className="ml-2 text-sm font-black text-content-green">Reward claimed</Text>
    </View>
  );
}
