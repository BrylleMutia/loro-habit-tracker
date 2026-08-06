# Feature #18 - Home Screen Widget (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-18)

### <a id="feature-18"></a>18. Home Screen Widget (P3)

**What:** iOS/Android home screen widget showing Lory, today's streak, and completion rings for habits.

**Why:** High engagement value — players see their progress without opening the app.

**Implementation notes:**
- Requires native widget targets/config plugins and therefore a development/production build; this cannot be validated in Expo Go.
- Re-evaluate the supported Expo widget approach against the app's SDK at implementation time rather than committing to an unverified package now.
- Widget shows: Lory icon, streak count, N/6 habits done today
- Write a minimal, non-sensitive widget snapshot through platform shared storage; never share Supabase tokens with the widget.
- Significant effort for cross-platform widget development

---

## Delivery Blueprint — Phase 3 — Long-Term Engagement and Compassionate Retention

### <a id="blueprint-feature-18"></a>Feature #18 — Home-Screen Widgets

**Technical approach**

- Treat widgets as native app-extension work that requires development/production builds and platform-specific testing. Keep Expo Go as the default for all other features.
- At implementation time, verify the supported widget tooling for the active Expo SDK. Plan for separate iOS and Android widget definitions even if a shared config layer is available.
- Add a versioned `WidgetSnapshot` containing only `updatedAt`, `dateKey`, display name if allowed, daily streak, completed/available habit counts, and a compact per-habit status list.
- After every successful game snapshot/mutation and meaningful app foreground event, write the minimal snapshot to platform-shared storage. Never write Supabase access/refresh tokens, emails, raw activity, or AI context.
- The widget reads shared data without calling Supabase directly. If data is stale or belongs to a previous date, show a neutral “Open Loro for today’s trails” state.
- Widget taps deep-link to Home or a specific active habit through a documented app link route.

**UX and verification**

- Create small, medium, light, and dark layouts that keep Lory recognizable without crowding progress.
- Do not promise exact midnight/background refresh; native widget scheduling is opportunistic. The stale-state design is mandatory.
- Test install/update/removal, logout/account switch, timezone rollover, no data, stale data, deep links, dark mode, text scaling, and both physical platforms.
