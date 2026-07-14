import { Platform, StyleSheet } from "react-native";

import { colors } from "../constants/colors";
import { themeEffects } from "../constants/themeTokens";

export const shadows = StyleSheet.create({
  card: Platform.select({
    web: {
      boxShadow: themeEffects.cardShadow
    },
    default: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
      elevation: 4
    }
  })
});
