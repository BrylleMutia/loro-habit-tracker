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
  rarity: {
    common: themeColors.rarity.common,
    uncommon: themeColors.rarity.uncommon,
    rare: themeColors.rarity.rare,
    epic: themeColors.rarity.epic,
    legendary: themeColors.rarity.legendary
  },
  raritySoft: {
    common: themeColors.rarity["common-soft"],
    uncommon: themeColors.rarity["uncommon-soft"],
    rare: themeColors.rarity["rare-soft"],
    epic: themeColors.rarity["epic-soft"],
    legendary: themeColors.rarity["legendary-soft"]
  },
  equipmentSets: themeColors.equipmentSets,
  line: themeColors.line.DEFAULT,
  lineBlue: themeColors.line.blue,
  graySoft: themeColors.surface.muted,
  grayLine: themeColors.line.muted,
  grayIcon: themeColors.content.icon,
  tabInactive: themeColors.content.subtle,
  overlay: themeColors.overlay,
  shadow: themeColors.shadow
} as const;
