import { Image, View } from "react-native";

import { images } from "../constants/images";

export function PlayerAvatarPlaceholder() {
  return (
    <View className="relative h-48 w-40 items-center justify-end">
      <View className="absolute bottom-2 h-3 w-24 rounded-pill bg-line-muted opacity-50" />
      <Image
        source={images.profileAvatar}
        className="h-full w-full"
        resizeMode="contain"
        accessibilityLabel="Player avatar"
        accessibilityRole="image"
      />
    </View>
  );
}
