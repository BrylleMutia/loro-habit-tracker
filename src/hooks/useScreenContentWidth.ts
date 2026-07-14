import { useWindowDimensions } from "react-native";

const SCREEN_MAX_WIDTH = 600;
const SCREEN_HORIZONTAL_GUTTER = 20;

export function useScreenContentWidth() {
  const { width: viewportWidth } = useWindowDimensions();

  return Math.max(
    Math.min(viewportWidth, SCREEN_MAX_WIDTH) - SCREEN_HORIZONTAL_GUTTER * 2,
    0
  );
}
