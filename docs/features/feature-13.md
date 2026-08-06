# Feature #13 - Dark Mode (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-13)

### <a id="feature-13"></a>13. Dark Mode (P2)

**What:** A dark variant of the pastel color palette, toggleable in Settings.

**Why:** Major QoL for evening habit logging. NativeWind supports `dark:` variants.

**Implementation notes:**
- Add `darkMode: "class"` to `tailwind.config.js`
- Define dark color tokens in `themeTokens.js`: `dark-canvas`, `dark-surface`, etc.
- Add `theme: "system" | "light" | "dark"` to `AppSettings`
- Toggle in More → Settings
- Persist through the existing settings/snapshot cache rather than adding a second general-purpose storage system solely for theme.
- System theme detection: `useColorScheme()` from React Native

---

## Delivery Blueprint — Phase 2 — Retention, Progression, and Core Polish

### <a id="blueprint-feature-13"></a>Feature #13 — Dark Mode

**Theme architecture**

- Expand semantic tokens, not component-specific colors: canvas, card, panel, content, muted content, primary, success, warning, reward, line, overlay, and shadow.
- Add `theme: "system" | "light" | "dark"` to settings. Resolve `"system"` through `useColorScheme()` and expose one `ThemeProvider`/hook near the app root.
- Configure NativeWind's class strategy in the SDK/NativeWind-supported way and apply the selected scheme at the root. Avoid scattering `useColorScheme()` across components.
- Provide runtime palettes for Ionicons, gradients, SVG, Reanimated, status bar, and native control props that cannot consume class names.
- Keep equipment rarity and reward semantics distinguishable in both themes; dark mode should remain Loro's pastel game identity, not become pure black/neon.

**Boot and persistence**

- Read the locally cached preference before or during root hydration to minimize theme flash, then reconcile with the authenticated server setting.
- If local cache and server differ, server wins for the account and the updated value is written back to cache.

**Verification**

- Audit every screen, modal, banner, disabled control, chart, transparent PNG edge, and system status/navigation bar.
- Verify contrast, large text, system theme changes while running, cold launch, guest/sign-in transition, and screenshots on Android/iOS/web.
