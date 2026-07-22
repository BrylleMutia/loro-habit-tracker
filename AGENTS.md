# Loro Habit Tracker Engineering Guide

## Product Overview

- `Loro Habit Tracker` is an Expo React Native app that turns everyday habits into short adventure quests.
- The initial habits are `Exercise`, `Reading`, `Water`, and `Sleep`.
- Lory is the app mascot. Use the blue/red/green pixel-art `Trail Captain` version consistently when Lory appears.
- The experience is light, friendly, compact, and game-inspired. It should encourage consistency without making routine logging tedious.
- The current implementation is a local prototype. It has no backend, authentication, persistence, push notifications, or production shop inventory yet.
- Reference designs and prior visual explorations live in `mockups/`.

## Current Game Loop

- Every habit has one Daily Quest per local calendar day.
- Adventure paths are long, completion-based paths divided into seven-node chapters. Each node represents one day, not one step inside a day.
- Completing today's quest advances only that habit by one node. Missing a day may reset streak effectiveness, but never removes path progress.
- Future nodes remain locked until the current node is completed and a new local day begins.
- Each habit has an independent streak. The app-wide streak advances only on the first completed habit of the day.
- Node rewards grant coins and XP per habit. Chapter rewards are claimable once after all seven chapter nodes are complete.
- The Loot Drop completion modal first shows coins and XP, then transitions to the updated streak page.

### Quest Types

- `timed`: Exercise and Reading. The user starts the quest, an in-app timer counts up from `00:00`, and completion is allowed only after the target duration.
- `one-time`: Water and Sleep. The UI shows one `Complete quest` action for the predetermined target.
- Energy is consumed when a guided timed quest starts. Water and Sleep must remain usable at zero energy.
- Keep the interaction model minimal: do not add text inputs, counters, or multi-step checklists to Daily Quests unless the product requirements explicitly change.

## Tech Stack

- Expo SDK 54
- React 19 and React Native 0.81
- Strict TypeScript
- NativeWind 4 with Tailwind CSS 3
- React Context API with `useReducer` for application state
- React Native Reanimated for quest celebration motion
- `react-native-safe-area-context` for safe areas
- `@expo/vector-icons/Ionicons` for UI icons

Keep Expo-managed package versions compatible with SDK 54. Do not independently upgrade React Native, Reanimated, Worklets, React, or `@types/react` without checking the Expo compatibility set.

## External Library And Plugin Documentation

- Use the `context7-mcp` skill and Context7 MCP server whenever work depends on an external library, framework, SDK, API, CLI, cloud service, or plugin used by this project. This includes implementation, setup, configuration, upgrades, API usage, library-specific debugging, and best-practice decisions.
- Consult Context7 before changing or recommending behavior for Expo, React, React Native, Supabase, NativeWind, Tailwind CSS, Reanimated, SecureStore, SQLite, Linking, Network, Ionicons, or any newly introduced dependency or plugin.
- Always call Context7 `resolve-library-id` first with the external library name and the full task, unless the task already supplies an exact Context7 ID in `/org/project` or `/org/project/version` form.
- Select the closest official source using exact name match, relevance, snippet coverage, source reputation, benchmark score, and the version installed in `package.json` or the Expo SDK compatibility set.
- Call Context7 `query-docs` with the resolved ID and a focused question. Use separate documentation queries for distinct concepts such as authentication, deep linking, migrations, caching, or deployment.
- Look up both the required API/configuration syntax and the library's current recommended practices. Apply the fetched guidance in a way that remains compatible with the versions actually installed in this repository.
- Prefer Context7 over memory or general web search for external-library documentation. If Context7 is unavailable or has no suitable source, say so and fall back to the library's official primary documentation.
- Context7 is not required for local business logic, visual design decisions, asset work, straightforward refactoring, or code review that does not depend on external API behavior.

## Commands

- `npm run start` starts the Expo development server.
- `npm run android` starts Expo and opens Android.
- `npm run ios` starts Expo and opens iOS.
- `npm run web` starts Expo web.
- `npm run typecheck` runs `tsc --noEmit` and is required after code changes.
- `npx expo start --tunnel` starts a tunnel when LAN access is unavailable.
- `npx expo install --check` checks Expo dependency compatibility.
- `npx expo-doctor` performs a broader Expo project diagnostic.

Prefer Expo Go first. Only create a custom development build when a dependency requires native code unavailable in Expo Go.

## Best Practices and Conventions
- TypeScript is strict via `tsconfig.json`.
- Styling uses NativeWind class names directly in React Native components.
- Icons come from `@expo/vector-icons/Ionicons`.
- For state management: use React's Context API.
- Keep UI edits consistent with the current compact mobile prototype style:
  - cards use the shared `rounded-card` token;
  - colors, spacing, radii, and effects are centralized in `src/constants/themeTokens.js`;
  - reusable cross-screen UI belongs in `src/components/`, while meaningful screen-local helpers may stay with their screen.
- Don't repeat yourself. Extract shared components, functions, and objects when they are reused or contain meaningful independent behavior.
- Don't overcomplicate logic and processes if it's doable in a simpler manner.
- Prefer readable naming and self-documenting code. Add comments only for non-obvious business invariants or platform workarounds.


## Application Architecture

- Keep `App.tsx` thin. It imports global CSS, installs root providers, and renders `AppNavigator`.
- `SafeAreaProvider` must remain above the application UI.
- `AppStateProvider` is the single source of truth for current global prototype state.
- `AppNavigator` owns the lightweight tab shell visually, but the active tab value lives in Context.
- Home, Profile, and More are implemented screens. Quests and Shop currently use placeholders.
- Home can switch locally between the dashboard and `HabitPathScreen`; do not promote transient view state to global state unless another screen needs it.

```text
src/
|-- services/ # API calls from external data sources
|   |-- api.tsx
|   |-- appwrite.tsx
|   `-- useFetch.tsx
|-- assets/
|   |-- fonts/
|   |   |-- font-name1.ttf
|   |   `-- font-name2.ttf
|   `-- images/
|       |-- icon1.png
|       `-- icon2.png
|-- components/ # React components and custom app components
|   |-- CustomButton.tsx
|   `-- MovieCard.tsx
|-- constants/
|   |-- icons.tsx
|   |-- fonts.tsx
|   |-- images.tsx
|   `-- colors.tsx
|-- hooks/ # Shared custom hooks
|   `-- index.tsx
|-- navigation/ # Base app navigation
|   |-- AppNavigator.tsx
|   |-- AuthNavigator.tsx
|   `-- TabNavigator.tsx
|-- redux/ # Redux files when react-redux is used
|   |-- actions/
|   |   |-- Action1.tsx
|   |   `-- Action2.tsx
|   |-- constants/
|   |   |-- Constants1.tsx
|   |   `-- Constants2.tsx
|   |-- reducers/
|   |   |-- Reducer1.tsx
|   |   `-- Reducer2.tsx
|   `-- store.tsx
|-- contexts/ # State management with Context API
|   |-- page1Context/
|   |   |-- index.tsx # Exports consumers, providers, etc.
|   |   |-- Context1.tsx # Contains part of the state
|   |   `-- Context2.tsx # Contains part of the state
|   `-- page2Context/
|       `-- index.tsx # Exports consumers, providers, etc.
|-- app/ # Main screens or pages for file-based routing
|   |-- home/
|   |   |-- index.tsx
|   |   `-- styles.tsx
|   |-- about/
|   |   |-- index.tsx
|   |   `-- styles.tsx
|   `-- profile/
|       |-- index.tsx
|       `-- styles.tsx
|-- styles/ # Reusable or global styles
|   `-- GlobalStyle.tsx
`-- utility/ # Shared utilities and helpers
    `-- index.tsx
```

Create new folders only when the feature needs them. Do not add speculative `services`, `hooks`, state libraries, or routing layers before they are used.

## State Management

- Use the existing Context API and reducer in `src/contexts/appContext/` for global state.
- Global state currently covers navigation, active habit, player profile, habits and paths, quest progress, streaks, coins, energy, daily check-in, inventory, settings, and activity history.
- New players must start from generated initial state: level 1, zero XP, zero coins, zero streaks, full energy, no completions, and the first node active for every habit.
- Keep domain mutations atomic in the reducer. Quest completion must update rewards, XP, energy, streaks, path completion, active timer state, and activity log together.
- Expose intent-based actions such as `startDailyQuest` and `completeDailyQuest`; screens must not reconstruct reducer rules.
- Store durable facts such as completion records and timestamps. Derive `active`, `done`, `locked`, progress percentages, and effective streaks through pure utility functions.
- Use local date keys in `YYYY-MM-DD` form for once-per-day behavior. Store event timestamps as ISO strings.
- Preserve discriminated unions for `timed` and `one-time` nodes so invalid quest fields are rejected by TypeScript.
- Use functional, immutable reducer updates. Do not mutate nested habit, profile, inventory, or log values.
- Persistence can be added behind the provider later. Do not couple UI components directly to storage APIs.

## Styling And Design

- Use NativeWind class names for component styling.
- Keep reusable colors, spacing, radii, and effects in `src/constants/themeTokens.js` and expose them through `tailwind.config.js`.
- Use `src/constants/colors.ts` only for runtime APIs that cannot consume class names, including icons, gradients, Reanimated values, and native style props.
- Reuse semantic utilities such as `bg-surface-card`, `text-content`, `bg-primary`, `rounded-card`, and `rounded-pill`. Do not scatter duplicate hex values or arbitrary dimensions through screens.
- The palette is light pastel: pale sky/mint/cream canvases, warm off-white cards, pastel-blue primary actions, and restrained green/red/gold reward states.
- Cards use an 8px radius through `rounded-card`; avoid excessive pill-shaped containers and nested cards.
- Keep mobile layouts compact, scannable, and touch-friendly. Use stable dimensions for timers, path nodes, resource pills, tab items, and avatar areas so content changes do not shift the layout.
- Screens with vertically growing content should use `ScrollView` and leave room for the persistent bottom tab bar.
- Use the shared shadow helper for platform-aware card shadows.
- Provide accessibility roles and concise labels for interactive controls and meaningful images.
- Use Ionicons instead of handwritten SVG icons when an appropriate icon exists.

## Art And Assets

- Register reusable image assets in `src/constants/images.tsx`; do not repeat `require()` calls across screens.
- Prefer transparent PNGs for characters, avatars, equipment, and other layered pixel art.
- Preserve hard, crisp pixel edges and use `resizeMode="contain"` for character artwork unless a full-bleed crop is intentional.
- Do not replace approved high-fidelity pixel art with styled `View` blocks or generic generated imagery.
- `parrot-trail-captain.png` is the canonical Lory mascot asset for pages and reusable mascot components.
- `profile-avatar-reference-v2.png` is the current player avatar artwork on the Profile page.
- App icon, adaptive icon, web favicon, name, and description are configured in `app.json`.
- Composite Home artwork should show the whole intended scene; use `contain` or an aspect-ratio-aware frame when cropping would hide Lory or the terrain.

## TypeScript And Naming

- TypeScript remains strict. Avoid `any`; define shared domain contracts in `src/types/app.ts`.
- Use `import type` for type-only imports.
- Use PascalCase for React component files and exports, `index.tsx` for screen entrypoints, camelCase for functions and values, and descriptive union IDs for domain entities.
- Use `.tsx` only when a file contains JSX, `.ts` for TypeScript logic, and `.js` for CommonJS configuration shared with Tailwind or Metro.
- Keep components focused. Extract shared UI when it is reused or when it contains meaningful independent behavior; do not create wrappers that only rename a `View`.
- Prefer readable names and small pure helpers over explanatory comments. Add comments only for non-obvious business invariants or platform workarounds.
- Avoid unrelated refactors when implementing a focused feature.

## Expo Dependency Rules

- `babel-preset-expo` must remain installed at the top level because `babel.config.js` references it directly.
- Babel must retain the Expo preset with `jsxImportSource: "nativewind"` and the NativeWind Babel transform.
- Metro must continue wrapping Expo's default config with `withNativeWind` and `global.css` as input.
- Keep React and `@types/react` on compatible major versions. Expo SDK 54 and React Native 0.81 require React 19-era types.
- Keep Reanimated and `react-native-worklets` aligned with Expo's recommended versions. A JavaScript/native mismatch can cause `installTurboModule` runtime failures on Android.
- Prefer `npx expo install <package>` for Expo-facing dependencies. Do not use `--force` or `--legacy-peer-deps` as the default fix for peer conflicts.
- After dependency changes, clear Metro's cache with `npx expo start --clear` before diagnosing native runtime issues.

## Verification

For every code change:

1. Run `npm run typecheck`.
2. Exercise the affected screen on a mobile-sized viewport.
3. Confirm text and controls do not overlap or overflow.
4. Confirm the bottom safe area and tab bar remain usable.
5. Check that image assets render fully and transparency is preserved.

For quest or state changes, also verify:

1. A new player sees node one active with zero prior progress.
2. Timed quests cannot complete before their target duration.
3. Water and Sleep work with zero energy.
4. A habit cannot complete more than once per local day.
5. Completing a second habit on the same day does not increment the app streak twice.
6. Rewards, XP, activity history, and path progress update together.
7. Node seven unlocks the chapter reward without losing completed path data.

## External References

- NativeWind: https://www.nativewind.dev/llms.txt
- React Native: https://reactnative.dev/
- Expo: https://docs.expo.dev/
- React Context: https://react.dev/reference/react/useContext
- Tailwind configuration: https://v3.tailwindcss.com/docs/configuration


Confidence on changes and confirmation:
Do not make any changes until you have 95% confidence in what needs to be built. Ask me follow-up questions until you reach that clarify and confidence on the implementation.