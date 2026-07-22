import type { ImageSourcePropType } from "react-native";
import { Image, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/colors";
import { getEquipmentSetTheme } from "../constants/equipmentSetThemes";

type SetShowcaseFrameProps = {
  avatarSource: ImageSourcePropType;
  profileName: string;
  setId: string | null;
};

export function SetShowcaseFrame({
  avatarSource,
  profileName,
  setId
}: SetShowcaseFrameProps) {
  const theme = getEquipmentSetTheme(setId);

  if (!theme) {
    return (
      <View className="h-full w-full overflow-hidden rounded-card border-2 border-line-primary bg-primary-soft">
        <Image
          source={avatarSource}
          resizeMode="cover"
          className="h-full w-full"
          accessibilityLabel={`${profileName} avatar`}
          accessibilityRole="image"
        />
      </View>
    );
  }

  return (
    <View
      className="h-full w-full overflow-hidden rounded-card border-2 p-1"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.accent
      }}
    >
      <View
        className="relative flex-1 overflow-hidden rounded-card border"
        style={{ borderColor: theme.colors.border }}
      >
        <Image
          source={avatarSource}
          resizeMode="cover"
          className="h-full w-full"
          accessibilityLabel={`${profileName} avatar wearing the complete ${theme.label} set`}
          accessibilityRole="image"
        />
        <Image
          source={theme.profileFrame}
          resizeMode="contain"
          className="absolute inset-0 h-full w-full"
          accessibilityLabel={`${theme.label} set profile frame`}
          accessibilityRole="image"
        />
        <View
          className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-pill border-2"
          style={{
            backgroundColor: theme.colors.accentSoft,
            borderColor: theme.colors.accent
          }}
          accessibilityLabel={`${theme.label} set mastery crest`}
          accessibilityRole="image"
        >
          <Ionicons name={theme.crestIcon} size={16} color={theme.colors.accentStrong} />
        </View>
        <View
          className="absolute bottom-2 left-2 right-2 items-center rounded-pill px-2 py-1"
          style={{ backgroundColor: theme.colors.accentStrong }}
        >
          <Text className="text-micro font-black uppercase" style={{ color: colors.card }} numberOfLines={1}>
            {theme.label} set
          </Text>
          <Text className="text-micro font-black uppercase" style={{ color: colors.card }}>
            Complete
          </Text>
        </View>
      </View>
    </View>
  );
}
