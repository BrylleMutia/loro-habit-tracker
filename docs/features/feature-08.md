# Feature #8 - Settings UI (P1)

> Roadmap index: [PLANS.md](../PLANS.md#feature-8)

### <a id="feature-8"></a>8. Settings UI (P1)

**What:** Expose the existing settings state (sound, haptics, reminders, timezone) in the More tab.

**Why:** The current UI exposes the most common toggles, but reminder scheduling, time editing, privacy controls, support, export, reset, and account deletion still need a coherent settings experience.

**Toggles and sections:**
- 🔔 Daily Reminder (on/off + time picker)
- 🔊 Sound Effects (on/off)
- 📳 Haptics (on/off)
- 🌍 Timezone (display-only for now, auto-detected)
- 🌓 Theme toggle (when dark mode is added)
- 🔒 Privacy: link to privacy policy, data usage summary
- 💬 Support & Feedback: email/message link
- 📤 Export Data: download game data as JSON
- 🗑️ Delete Account / Reset Progress: with confirmation flow

**Current status:**
- ✅ More currently exposes sound, haptics, and daily-reminder toggles through `updateSettings`.
- ✅ Habit target controls for Feature #28 are present in the current implementation.
- ☐ Reminder time editing, timezone display, theme, privacy/support links, data export, account deletion/reset, permission state, and notification scheduling remain.

---

## Delivery Blueprint — Phase 1 — Complete the P1 Core Experience

### <a id="blueprint-feature-8"></a>Feature #8 — Settings, Privacy, and Account Controls

**Product and UX**

- Keep immediate toggles for sound and haptics. Reminder enablement opens permission/scheduling guidance when required.
- Add a time picker for `dailyReminderTime`; show the resolved timezone as read-only with a “Use device timezone” refresh action.
- Add separate rows for Theme, Replay Tutorial, Privacy Policy, Data Use, Support/Feedback, Export Data, Reset Progress, and Delete Account.
- Destructive actions use typed confirmation copy that clearly distinguishes local reset, server progress reset, and permanent account deletion.

**Client and domain**

- Extract a reusable settings mutation helper that supports optimistic state, in-flight disabling, rollback, and error reporting; avoid duplicating ad hoc optimistic state per row.
- Save multi-step values such as habit targets and reminder time as a draft with an explicit Save action or a debounced latest-write-wins mutation.
- Add `theme: "system" | "light" | "dark"` and `onboardingVersion` to `AppSettings` only when their features are implemented.
- Keep permission status and scheduled notification identifiers device-local; they are not portable user settings.

**Backend and integrations**

- Continue validating all accepted settings keys, types, ranges, and timezone names in `update_settings`; reject unknown nested economy/game fields.
- Data export should be produced by an authenticated Edge Function or scoped RPC and contain only the user's portable data. Do not include access tokens, internal lease tokens, or provider secrets.
- Account deletion requires recent authentication, an authenticated server function using an admin secret, cascading data deletion, session revocation/sign-out, and a recoverability warning.
- “Reset progress” should be a separate transactional RPC with explicit scope and should preserve the auth identity/settings that product decides to retain.

**Verification**

- Test optimistic rollback, repeated rapid changes, offline behavior, permission denial, invalid timezone/time, guest reset, authenticated export ownership, and delete-account authorization.
