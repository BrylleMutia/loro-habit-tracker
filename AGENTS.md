# Project Notes

## Overview
- Expo React Native prototype for `Loro Habit Tracker`.
- Main UI lives in `App.tsx` as a single-screen NativeWind-based mockup selector.
- Three visual directions are implemented: `trail`, `arcade`, and `studio`.
- Reference images live in `mockups/`.

## Commands
- `npm run start` starts Expo.
- `npm run android` starts Expo for Android.
- `npm run ios` starts Expo for iOS.
- `npm run web` starts Expo web.
- `npm run typecheck` runs `tsc --noEmit`.

## Conventions
- Nativewind: [https://www.nativewind.dev/llms.txt]
- React Native: [https://reactnative.dev/]
- Expo: [https://docs.expo.dev/]
- Context API: [https://legacy.reactjs.org/docs/context.html]
- TypeScript is strict via `tsconfig.json`.
- Styling uses NativeWind class names directly in React Native components.
- Icons come from `@expo/vector-icons/Ionicons`.
- For state management: use React's Context API.
- Keep UI edits consistent with the current compact mobile prototype style:
  - rounded corners are mostly `rounded-lg` or smaller;
  - theme-specific colors are centralized in the `mockups` array;
  - repeated sections use local helper components in `App.tsx`.
- Don't repeat yourself. Always make sure that components, functions, and objects are reusable within the whole application.
- Don't overcomplicate logic and processes if it's doable in a simpler manner.
- Always document the logic and processes by leaving comments and readable naming convention.

## Environment Notes
- The repository currently has no committed files; `git status --short` reports all project files as untracked.
- The Windows sandbox helper was unavailable during initialization, so shell inspection required approved escalated read-only commands.


## Folder Structure and File Naming Convention

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

