import { Image } from "react-native";
import { images } from "../constants/images";

type PixelParrotProps = {
  size: "sm" | "md" | "lg";
  mirrorX?: boolean;
};

const parrotSizes = {
  sm: { width: 54, height: 54 },
  md: { width: 86, height: 86 },
  lg: { width: 132, height: 132 }
} as const;

export function PixelParrot({ size, mirrorX = false }: PixelParrotProps) {
  const dimensions = parrotSizes[size];

  return (
    <Image
      source={images.parrotMascot}
      resizeMode="contain"
      style={{
        width: dimensions.width,
        height: dimensions.height,
        transform: mirrorX ? [{ scaleX: -1 }] : undefined
      }}
      className="transform -rotate-180"
    />
  );
}