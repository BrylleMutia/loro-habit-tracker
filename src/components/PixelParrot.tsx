import { Image } from "react-native";

import { images } from "../constants/images";

type PixelParrotProps = {
  size: "sm" | "md" | "lg";
};

const parrotSizes = {
  sm: { width: 54, height: 58 },
  md: { width: 82, height: 89 },
  lg: { width: 122, height: 132 }
} as const;

export function PixelParrot({ size }: PixelParrotProps) {
  const dimensions = parrotSizes[size];

  return (
    <Image
      source={images.parrotMascot}
      resizeMode="contain"
      style={{ width: dimensions.width, height: dimensions.height }}
    />
  );
}
