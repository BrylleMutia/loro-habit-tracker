/**
 * Shared visual tokens for Tailwind utilities and React Native style props.
 * Keep raw color and dimension values here so the app has one styling source.
 */
const themeColors = {
  content: {
    DEFAULT: "#0B2551",
    strong: "#111D35",
    muted: "#6D7890",
    subtle: "#7E899B",
    icon: "#8792A4",
    "blue-muted": "#58728F",
    green: "#4C8060",
    "green-deep": "#4C6B5A",
    gold: "#8A671E",
    "gold-strong": "#A66E08",
    red: "#C95D49"
  },
  canvas: {
    sky: "#DFF5FF",
    mint: "#EAF9EF",
    cream: "#FFF7EA"
  },
  surface: {
    card: "#FFFDF7",
    soft: "#F8FBF3",
    muted: "#F3F7F8",
    panel: "#F3F8FB",
    section: "#F5FBFF",
    disabled: "#F6F8F9",
    blue: "#F4FAFF",
    green: "#F2FFF5",
    red: "#FFF0EC"
  },
  primary: {
    DEFAULT: "#56A6F7",
    strong: "#2F80ED",
    soft: "#E7F4FF",
    pale: "#DFF5FF"
  },
  success: {
    DEFAULT: "#56C878",
    soft: "#E9F8EE",
    pale: "#DDF7E5"
  },
  danger: {
    DEFAULT: "#F46F64"
  },
  reward: {
    DEFAULT: "#F5B739",
    soft: "#FFF3D6",
    earned: "#C78A12"
  },
  rarity: {
    common: "#D7DEE5",
    "common-soft": "#F8FBFD",
    uncommon: "#A96F45",
    "uncommon-soft": "#F7EBDD",
    rare: "#4D9CEB",
    "rare-soft": "#E6F3FF",
    epic: "#9A72DF",
    "epic-soft": "#F1EAFE",
    legendary: "#EAB52F",
    "legendary-soft": "#FFF3C7"
  },
  line: {
    DEFAULT: "#E6EDF2",
    blue: "#D8EAF4",
    muted: "#C9D2DC",
    disabled: "#D8E1E8",
    locked: "#E7EBEF",
    subtle: "#EEF2F4",
    progress: "#E8EEF2",
    timer: "#DCECF7",
    success: "#BEE8CA",
    reward: "#FFE2A8",
    "reward-strong": "#F7D27D",
    "reward-muted": "#F3E3BC",
    primary: "#CCE5F8",
    hero: "#B7DDF9",
    red: "#FFD6CE",
    "blue-strong": "#B8E4FA",
    "blue-accent": "#72B9F3",
    "blue-muted": "#A7D5F5"
  },
  overlay: "rgba(11, 37, 81, 0.42)",
  shadow: "#7AA7BF"
};

const themeSpacing = {
  "path-line": "0.125rem",
  "tab-item": "3.625rem",
  "quest-node": "3.875rem",
  "path-node": "4.625rem",
  speech: "12.625rem",
  action: "11.875rem",
  hero: "14.125rem"
};

const themeEffects = {
  cardShadow: "0 8px 18px rgba(122, 167, 191, 0.12)"
};

module.exports = { themeColors, themeEffects, themeSpacing };
