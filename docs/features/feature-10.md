# Feature #10 - Push Notifications (P2)

> Roadmap index: [PLANS.md](../PLANS.md#feature-10)

### <a id="feature-10"></a>10. Push Notifications (P2)

**What:** Local scheduled notifications for device-known reminders and state changes, with remote push reserved for events that originate on the server.

**Why:** Settings already scaffolds `dailyReminderEnabled` and `dailyReminderTime`. Notifications are the #1 retention tool for habit apps.

**Notification types:**
- Daily reminder at user's chosen time: "Lory's waiting! Time for your daily quest. 🦜"
- Streak-at-risk at 8 PM: "Your 7-day 🔥 is at risk! Complete a quest before midnight."
- Energy full: "Your energy is fully restored. Ready for adventure?"
- Guild quest expiring: "A guild quest expires tomorrow — claim your reward!"

**Implementation notes:**
- Install the Expo SDK-compatible `expo-notifications` version with `npx expo install` and verify it in a development build
- Put permission/scheduling behavior in a dedicated notification service/coordinator rather than adding more side effects to `AppStateProvider`.
- Respect `dailyReminderEnabled` toggle
- Ask permission when the user enables reminders or during an explicit onboarding step; do not prompt automatically on first launch without context.
- Separate local scheduled reminders from server-triggered push notifications. Device-token storage and remote sends are not required for the first local-reminder slice.

---

## Delivery Blueprint — Phase 2 — Retention, Progression, and Core Polish

### <a id="blueprint-feature-10"></a>Feature #10 — Notifications

**Stage 1: local scheduled reminders**

- Install the Expo SDK 54-compatible `expo-notifications` package with `npx expo install` and add the required app configuration/plugin.
- Create `src/services/notificationScheduler.ts` with semantic operations such as `getPermissionState`, `requestPermission`, `scheduleDailyReminder`, `scheduleStreakRiskReminder`, and `cancelLoroNotifications`.
- Store Loro's scheduled notification identifiers in device-local storage and cancel only those identifiers. Never call “cancel all” because the device may contain unrelated schedules owned by other app features.
- Request permission when the user enables reminders or accepts an onboarding explanation. If denied, keep the server setting honest by showing “Permission blocked on this device” and a Settings deep link.
- Create an Android notification channel with restrained sound/vibration. Test physical Android/iOS devices; notification behavior is not fully represented by web or Expo Go.

**Scheduling rules**

- The daily reminder uses `dailyReminderTime` in the user's current device timezone and is rescheduled when the time, timezone, permission state, or enabled state changes.
- Streak-risk reminders schedule only when there is an active streak and an unfinished eligible habit; cancel them immediately after the relevant completion.
- Energy-full reminders derive the projected refill instant from `energy.current`, `energy.max`, and `lastRefillAt`; reschedule after energy spend/refill.
- Guild-expiry reminders include a stable quest/period identifier and are canceled after claim or period rollover.
- Notification payloads contain only routing identifiers, never full profile/activity context.

**Stage 2: remote push**

- Add a `user_push_devices` table with user ownership, Expo/device token, platform, last-seen time, disabled time, and unique token constraint.
- Use RLS for user reads/deletes; register/refresh tokens through a validated RPC. Prune invalid tokens after provider errors.
- Use scheduled server jobs/Edge Functions only for notifications that must arrive when the app has not recently opened. Keep provider credentials server-side.
- Deep-link into an existing tab/view and handle missing/expired targets gracefully.

**Verification**

- Test permission not determined/denied/granted, timezone change, daylight-saving transition, reboot/reschedule, duplicate schedule prevention, completion cancellation, guest mode, and notification taps from cold/background/foreground state.
