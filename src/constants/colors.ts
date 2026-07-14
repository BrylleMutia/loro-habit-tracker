import { themeColors } from "./themeTokens";

// Runtime alias for APIs that cannot consume NativeWind class names (icons,
// gradients, Reanimated styles, and native shadows).
export const colors = {
  ink: themeColors.content.DEFAULT,
  inkDeep: themeColors.content.strong,
  muted: themeColors.content.muted,
  sky: themeColors.canvas.sky,
  mint: themeColors.canvas.mint,
  cream: themeColors.canvas.cream,
  card: themeColors.surface.card,
  cardSoft: themeColors.surface.soft,
  blue: themeColors.primary.DEFAULT,
  blueDark: themeColors.primary.strong,
  blueSoft: themeColors.primary.soft,
  green: themeColors.success.DEFAULT,
  greenSoft: themeColors.success.soft,
  red: themeColors.danger.DEFAULT,
  gold: themeColors.reward.DEFAULT,
  goldSoft: themeColors.reward.soft,
  line: themeColors.line.DEFAULT,
  lineBlue: themeColors.line.blue,
  graySoft: themeColors.surface.muted,
  grayLine: themeColors.line.muted,
  grayIcon: themeColors.content.icon,
  tabInactive: themeColors.content.subtle,
  overlay: themeColors.overlay,
  shadow: themeColors.shadow,
  lineBlueStrong: themeColors.line["blue-strong"],
  lineBlueAccent: themeColors.line["blue-accent"],
  lineBlueMuted: themeColors.line["blue-muted"]
} as const;
