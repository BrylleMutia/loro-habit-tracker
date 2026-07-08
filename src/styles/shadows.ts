import { Platform, StyleSheet } from "react-native";

export const shadows = StyleSheet.create({
  card: Platform.select({
    web: {
      boxShadow: "0 8px 18px rgba(122, 167, 191, 0.12)"
    },
    default: {
      shadowColor: "#7AA7BF",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
      elevation: 4
    }
  })
});
