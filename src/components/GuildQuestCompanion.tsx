import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";

const COMPANION_SIZE = 104;

/** Web-safe fallback. The briefing text remains rendered independently by the card. */
export function GuildQuestCompanion() {
  return (
    <View
      accessible
      accessibilityLabel="Guild quest companion fallback"
      className="items-center justify-center rounded-full bg-surface-blue"
      style={{ width: COMPANION_SIZE, height: COMPANION_SIZE }}
    >
      <Ionicons
        name="shield-checkmark-outline"
        size={52}
        color={colors.blueDark}
      />
    </View>
  );
}
