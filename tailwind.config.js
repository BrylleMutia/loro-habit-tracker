const { themeColors, themeEffects, themeSpacing } = require("./src/constants/themeTokens");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  // The pastel experience is light-first; class mode keeps future user choice explicit.
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: themeColors,
      fontFamily: {
        sans: ["System"],
        display: ["System"]
      },
      fontSize: {
        micro: ["0.625rem", { lineHeight: "0.875rem" }]
      },
      spacing: themeSpacing,
      borderRadius: {
        card: "0.5rem",
        pill: "9999px"
      },
      boxShadow: {
        card: themeEffects.cardShadow
      }
    }
  },
  plugins: []
};
