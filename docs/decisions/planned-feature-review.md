# Review of User's Existing Planned Features

> Decision record extracted from the roadmap. Read this file only when the task touches this topic.

## <a id="review-of-planned"></a>Review of User's Existing Planned Features

Below is a review of each item from the user's original list, assessed for conflicts, quality, and alignment with the current codebase.

### ☑ Already Completed

| Item | Assessment |
|------|------------|
| ☑ Implement functionality for buttons / update animations | ✅ Done. `QuestActionButton` supports tap + hold, Reanimated progress ring, completion state. |
| ☑ Design daily check-in modal | ✅ Done. `QuestCelebrationModal` with `"trail-stamp"` variant. |
| ☑ Backend (Supabase) | ✅ Done. `gameRepository.ts`, `supabaseClient.ts`, migrations, seed data. |
| ☑ Database | ✅ Done. Full schema in `supabase/migrations/`. |
| ☑ Authentication / Login pages | ✅ Done. `AuthScreen` with email magic link + guest sessions. |
| ☑ Loot drop after quest completion | ✅ Done. `QuestCelebrationModal` with `"loot-drop"` variant. |
| ☑ Gears on profile page | ✅ Done. `EquipmentLoadoutGrid` + `SetShowcaseFrame` on Profile. |
| ☑ Generate placeholder assets for loadout | ✅ Done. Equipment images registered in `constants/images.tsx`. |

---

### ☐ Not Yet Started — with Assessment

| Item | Verdict | Reasoning |
|------|---------|-----------|
| ☐ Fix modal background popping with the modal | ✅ **Good.** Known RN issue. The `QuestCelebrationModal` uses React Native `Modal` — background "jumps" on open. Fix: use `statusBarTranslucent` + `transparent` status bar, or use Reanimated enter/exit instead of native Modal. Low effort, high polish. |
| ☐ Landing page with app details / screenshots / waitlist | ✅ **Good.** See [feature #31](../features/feature-31.md#feature-31). Separate project, needed pre-launch. |
| ☐ Let user pick up to 5 max habits | ✅ **Good.** Currently 6 habits are hardcoded. Reducing to 5 selectable from 6+ options gives agency. Related to [custom habits](../features/feature-28.md#feature-28) and [IKEA onboarding](../features/feature-25.md#feature-25). The `habitOrder` constant and `createInitialHabits()` would need a `selectedHabitIds` parameter. |
| ☐ IKEA effect on signup | ✅ **Excellent.** Detailed in [feature #25](../features/feature-25.md#feature-25). The multi-step flow (habits → first quest → signup → Lory confirmation) is well thought out. High conversion impact. |
| ☐ Badges on navigation bar | ✅ **Good.** Detailed in [feature #26](../features/feature-26.md#feature-26). Red dot indicators. Low effort, high polish. |
| ☐ What to do after completing Habit's adventure path? | ✅ **Critical.** Discussed in the [dedicated section](./after-adventure-paths.md#after-adventure-paths). Recommendation: more chapters + prestige loop. |
| ☐ Custom habit / timer? | ✅ **Good.** Detailed in [feature #28](../features/feature-28.md#feature-28). Significant effort but high value for user agency. |
| ☐ Home Screen Widgets | ✅ **Good.** See [feature #18](../features/feature-18.md#feature-18). High effort, high engagement. Android + iOS. |
| ☐ Lory's Push Notifications | ✅ **Good.** See [feature #10](../features/feature-10.md#feature-10). Essential for retention. Use Lory's voice: "Lory's waiting! 🦜" |
| ☐ "Campfire" Rest Days | ✅ **Good.** Detailed in [feature #27](../features/feature-27.md#feature-27). Compassionate alternative to streak shields. Differentiates from punitive habit apps. |
| ☐ A way for user to display already collected sets | ✅ **Good.** The Profile screen already has `SetShowcaseFrame` and `getEquipmentSetProgressList()`. This is partially done — the showcase exists but could be made more prominent with a "Collection Gallery" view showing all sets and their completion percentage. |
| ☐ Business model? | ✅ **Important.** Discussed in [feature #32](../features/feature-32.md#feature-32). Recommendation: free + cosmetic IAP subscription. Don't paywall core mechanics. |
| ☐ How to flood loot pool if more sets are released | ✅ **Good concern.** Discussed in [Loot Pool Management](./loot-pool-management.md#loot-pool-management). "Focus set selector" with weighted drops. |
| ☐ Before deployment: Have a different LLM check security / QA / Code review | ✅ **Required launch work.** Tracked as [feature #43](../features/feature-43.md#feature-43). Independent human/automated/LLM reviews are complementary inputs; completion also requires RLS/authorization tests, dependency review, staged builds, telemetry, migration checks, and rollback/recovery drills. |
| ☐ Shop / Trade | ✅ **Good.** Shop = [feature #5](../features/feature-05.md#feature-5). "Trade" requires more thought — player-to-player trading adds significant complexity (duping, economy balance). Recommend shop first, trade much later or never. |
| ☐ Friend / Social aspect | ✅ **Good.** See [feature #30](../features/feature-30.md#feature-30). Start minimal: friend codes + streak visibility. |
| ☐ Calendar view / GitHub-style contribution heatmap | ✅ **Good.** See [feature #24](../features/feature-24.md#feature-24). Fits naturally in the Stats dashboard. |
| ☐ Refine and revisit paths | ✅ **Ongoing.** Adventure paths should be reviewed after playtesting. Are 7-day chapters the right length? Are node titles engaging? Is the 2-chapter limit enough? Tied to the ["what happens after"](./after-adventure-paths.md#after-adventure-paths) question. |
| ☐ Profile: analytics / charts / diagrams | ✅ **Good.** See [feature #7](../features/feature-07.md#feature-7) (Stats dashboard). User marks this as MUST. |
| ☐ Guided tour / tutorial | ✅ **Good.** See [feature #14](../features/feature-14.md#feature-14). User marks this as MUST. |
| ☐ Analytics / error tracking | ✅ **Required launch work.** See [feature #43](../features/feature-43.md#feature-43). Select one crash/error service and one privacy-reviewed product analytics service, with typed events and strict redaction. |
| ☐ Design badges | ✅ **Good.** See [feature #11](../features/feature-11.md#feature-11). The 4 existing badge definitions are a start. Expand to 10+ with the ones listed above. |
| ☐ Potions / buffs | ✅ **Good.** Already scaffolded: `ActiveBuff` type and `activeBuffs` array exist in inventory. Tied to the [Shop](../features/feature-05.md#feature-5). "Energy Elixir" and "XP Charm" are natural first buffs. |
| ☐ Replace quests with something that users can utilize gear attributes? | ⚠️ **Needs clarification.** Currently gear attributes (strength, agility, etc.) are purely cosmetic/collectible — they show on Profile but don't affect gameplay. Using them in quests (e.g., "Strength +3 = 10% faster timed quests") could add depth, but risks complicating the simple habit loop. **Recommendation:** Add small passive bonuses (e.g., total Vitality reduces energy cost by 1 per 10 points). Keep it subtle and never gate quest completion behind stats. |
| ☐ Audio feedback to make the actions and buttons more satisfying | ✅ **Good.** Already partially done (`expo-audio` for button presses, `AppAudioProvider`). See [feature #20](../features/feature-20.md#feature-20) for expansion. |
| ☐ Optimize assets and images | ✅ **Good.** Tracked as [feature #44](../features/feature-44.md#feature-44): asset inventory, pixel-safe optimization, audio policy, orphan/duplicate detection, deferred loading, and CI bundle budgets. |
| ☐ Animations / Idle Animations on the Adventure Path | ✅ **Good.** Related to [feature #15](../features/feature-15.md#feature-15). Idle animations on Lory (gentle bob, occasional wing flap) would make the Home screen feel alive. Use `withRepeat` + `withSequence` on Reanimated values. |
| ☐ Custom illustrations (for empty spaces, modals) | ✅ **Good.** Related to [feature #22](../features/feature-22.md#feature-22). A consistent illustration style for empty states, error states, and celebrations. |
| ☐ Haptic feedback (when starting/completing quests) | ✅ **Good.** User marks as MUST. See [feature #6](../features/feature-06.md#feature-6). |
| ☐ SSO login (Google) | ✅ **Good.** User marks as MUST. See [feature #29](../features/feature-29.md#feature-29). |

---
