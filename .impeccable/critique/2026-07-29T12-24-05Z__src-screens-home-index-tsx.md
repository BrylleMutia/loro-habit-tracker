---
target: current Loro Home and Daily Quest experience
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-07-29T12-24-05Z
slug: src-screens-home-index-tsx
---
⚠️ DEGRADED: single-context (Assessment A sub-agents did not return a final report after repeated timeouts; Assessment B remained isolated)

# Loro Home Design Critique

Target: `src/screens/home/index.tsx`

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | Sync, timer, completion, disabled, and cooldown states are explicit; progress bars still lack equivalent accessible value/status treatment. |
| 2 | Match Between System and Real World | 3/4 | The trail/quest metaphor is coherent and friendly, but unlabeled resource iconography and “World 01 / Trail map” require game-language inference. |
| 3 | User Control and Freedom | 2/4 | Habit switching and path back-navigation are clear, but the daily check-in auto-modal interrupts entry and completed mutations have no recovery path. |
| 4 | Consistency and Standards | 3/4 | Semantic tokens, shared cards, and shared action controls create a coherent system; compact icon controls and fixed-height exceptions weaken it. |
| 5 | Error Prevention | 3/4 | Hold-to-complete, energy gating, offline disabling, and in-flight mutation guards prevent common mistakes. |
| 6 | Recognition Rather Than Recall | 3/4 | Tabs and habits have visible labels and status icons, but resource meanings, “World 01,” and some compact status treatments are not self-explanatory. |
| 7 | Flexibility and Efficiency of Use | 2/4 | Persistent tabs, swipe navigation, and direct habit switching help repeat use, but the primary quest action remains deep in a rigid vertical sequence. |
| 8 | Aesthetic and Minimalist Design | 2/4 | The visual world is appealing and coherent, but the oversized hero and stacked cards give secondary information more space than the daily action. |
| 9 | Error Recognition, Diagnosis, and Recovery | 3/4 | The sync banner preserves state, explains offline/error conditions, and offers retry/dismiss controls; some caught action failures depend on that global banner rather than local recovery. |
| 10 | Help and Documentation | 1/4 | Lory provides contextual encouragement, but Home offers no visible explanation of resources, holds, energy rules, or trail terminology before users need them. |
| **Total** |  | **25/40** | **Acceptable — a distinctive foundation with major hierarchy and compact-layout issues.** |

## Design Specificity Verdict

### LLM assessment

Home feels authored for Loro rather than category-interchangeable. The canonical pixel-art Trail Captain, trail-map scenery, quest vocabulary, hold-to-complete behavior, reward grammar, and habit-specific path states form a coherent product identity. The emotional tone is friendly and non-guilt-based.

The weakest part is structural specificity. Beneath the art direction, the screen is a familiar vertical dashboard stack: metric capsule, oversized hero, configuration card, action card, and map card. Loro’s strongest identity is concentrated in the hero, while the product-defining Daily Quest is visually and spatially subordinate. A more authored composition would make “choose a trail, complete today’s quest, advance” the unmistakable spine of the screen and let Lory frame that loop rather than precede it with a large scenic block.

### Deterministic scan

The detector found exactly one warning in one file:

- `side-tab` / “Side-tab accent border” at `src/screens/home/index.tsx:327`, triggered by `border-l-4` on Lory’s briefing.

This is a partial false positive. The border is attached to a product-specific speech/briefing surface beside Lory, not repeated as arbitrary dashboard decoration. It remains a useful P3 polish prompt because the surface also combines a shadow, rounded card, icon, uppercase eyebrow, and scenic art; if the briefing is already competing with the quest, the thick side accent adds unnecessary weight.

No other deterministic rules fired.

### Visual overlays

No reliable user-visible overlay is available. The browser runtime reported `No browser is available`, and the browser inventory was `[]`, so no fresh tab, mutable-injection preflight, screenshot, console inspection, or `[Human]` overlay could be created. The visual conclusions below therefore distinguish source-proven layout geometry from runtime observations.

## Overall Impression

Loro Home has real charm and unusually coherent product language. The resource states, quest mechanics, and progression feedback feel intentional rather than decorative. The single biggest opportunity is to reverse the current priority: the Daily Quest should dominate the opening experience, while the scenic greeting, briefing, resource explanation, settings, and map become compact context around it.

At the documented 321×677 compact reference, the current source places a 290 px hero and a substantial active-habit card before the Daily Quest. The player can understand the world before they can act in it. For a daily habit product, that is the wrong trade.

## Cognitive Load

**Result: high cognitive load, with 4 of 8 checklist items failing.**

- **Single focus — fail.** Before reaching the quest, Home presents four resource values, daily check-in, greeting, map metadata, briefing/refresh, settings, progress, and six habit choices.
- **Chunking — pass.** Resources, greeting, habits, quest, and map are placed in recognizable groups.
- **Grouping — pass.** Card boundaries, spacing, and semantic surfaces communicate relationships consistently.
- **Visual hierarchy — fail.** The scenic hero is the largest block, while the product’s primary task appears after it and the habit-management card.
- **One thing at a time — fail.** The player can claim a reward, refresh Lory, open settings, select one of six habits, start/complete a quest, or open the map from the same dashboard.
- **Minimal choices — fail.** The active-habit decision point exposes six habit buttons plus settings; this exceeds the four-item working-memory target.
- **Working memory — pass.** The selected habit, its day/chapter context, quest target, reward, energy cost, and timer state are visible when the quest is reached.
- **Progressive disclosure — pass, narrowly.** Detailed path and equipment surfaces open separately, though resource meanings and secondary dashboard actions could be disclosed more selectively.

## Emotional Journey

The opening is warm: a time-aware greeting, Lory, soft scenery, and “Your trail is waiting” avoid guilt. The quest states also handle success well: completion uses calm green confirmation, reward values, a reset countdown, and a richer loot celebration only after authoritative success.

The emotional valley occurs between welcome and agency. A daily check-in modal can interrupt Home immediately, and after dismissal the player still scrolls through a large greeting and habit-management block before reaching today’s action. That sequence risks making returning users feel managed rather than momentum-rich.

The end of the action is stronger than the middle. Hold feedback, sound/haptics, explicit completion state, loot, and path advancement provide a satisfying peak and end. The screen should bring that strong interaction closer to the opening.

## What’s Working

1. **The interface has a genuine Loro point of view.** The Trail Captain art, scenic trail setting, reward colors, map nodes, and friendly copy form a recognizable world. The app does not read as a generic habit tracker with a mascot pasted on top.

2. **Quest state design is unusually thorough.** `DailyQuestCard` covers active, timed, ready-to-complete, completed, no-path, offline, insufficient-energy, and syncing conditions. `QuestActionButton` prevents duplicate action, communicates tap versus hold, keeps dimensions stable during feedback, and respects reduced motion.

3. **The visual system is coherent and implementation-aware.** Semantic NativeWind tokens, shared shadows, warm-card surfaces, tabular timer numerals, labeled bottom tabs, accessible state props, and a bounded four-line briefing align with the project’s own design contract.

## Priority Issues

### [P1] The Daily Quest is buried below secondary content

**What:** `HomeScreen` orders Resource Bar → 290 px Hero Greeting → Active Habit Card → Daily Quest → Adventure Map. On a compact phone, the quest title and action cannot enter the initial viewport.

**Why it matters:** The product loop is “choose a habit → complete one clear quest → receive feedback → advance the trail.” The current hierarchy makes scenery, briefing, settings, and habit management more immediate than completion. Returning users pay a scroll tax every day before reaching the one action the app exists to support.

**Fix:** Build one compact “today” cluster directly below resources: a horizontally scrollable or otherwise compact habit switcher, the selected habit/day context, and the Daily Quest action. Reduce Lory’s opening contribution to a compact one- or two-line briefing with a small avatar, then place the full scenic hero and Adventure Map after the quest or make them collapsible. At 321×677, the quest title and primary CTA should be visible or reachable with one short scroll gesture.

**Suggested command:** `$impeccable layout`

### [P1] The compact-width and large-text layout is mathematically brittle

**What:** At 321 px viewport width, `useScreenContentWidth` gives Home 281 px. The 44 px check-in button plus its 8 px margin leaves 229 px for the resource capsule. Its four `ResourcePill` minimum widths total 212 px; three dividers add 3 px; and horizontal capsule padding adds 40 px, for a 255 px minimum before text scaling. The capsule uses `overflow-hidden`, so clipping is a predictable outcome. The hero is also fixed at 290 px with `overflow-hidden`, while habit buttons are fixed at 44 px and force one-line labels.

**Why it matters:** The project explicitly names 321×677, large text, narrow phones, complete image bounds, and reachable actions as requirements. Resource loss, truncated habit names, and overlapping hero content undermine game-rule comprehension and accessibility.

**Fix:** Give resources a compact-width alternative—reduce capsule padding, allow a two-row resource layout, or move refill detail into an expandable label—without clipping values. Replace `h-hero` with a minimum-height or breakpoint-specific composition that can grow under text scaling. Allow habit selectors to grow vertically and wrap labels; test at system large-text sizes rather than preserving the three-column grid at all costs.

**Suggested command:** `$impeccable adapt`

### [P1] Important icon controls miss the 44×44 interaction floor

**What:** The Lory refresh button and habit-target settings button are each visibly and interactively `h-7 w-7` (28×28) with no `hitSlop`. Progress tracks expose visual percentage but no equivalent accessible value. `PixelParrot` is neither explicitly described as meaningful nor hidden as decorative.

**Why it matters:** These controls are difficult for users with motor impairments and violate the repository’s stated 44×44 target requirement. Screen-reader users receive labels for the icon buttons, but progress and image semantics remain incomplete.

**Fix:** Preserve the compact 28 px visual treatment inside a 44×44 pressable wrapper or add verified hit slop. Give quest/path progress an accessible label and current/min/max value or a nearby accessible text summary. Decide whether Lory is informative in this context: add a concise label if so, or hide the decorative image from accessibility if the briefing already conveys the meaning.

**Suggested command:** `$impeccable audit`

### [P2] The daily check-in and ambient motion compete with the primary loop

**What:** `AppNavigator` automatically opens the daily check-in modal once per date before the player acts on Home. When dismissed, an unclaimed gift icon continues a repeated nudge while Lory can also animate during briefing generation. The adjacent check-in affordance already exists in the resource bar.

**Why it matters:** An opt-in reward becomes a mandatory interruption, and multiple animated cues compete for attention before the Daily Quest is visible. This weakens calmness and makes repeat visits feel more promotional than task-focused.

**Fix:** Let the adjacent gift control carry the unclaimed state and open the modal only after user intent, or defer the prompt until after the first quest interaction. Ensure only one ambient attention cue runs at a time. Retain the current reduced-motion behavior.

**Suggested command:** `$impeccable distill`

### [P3] Lory’s briefing surface is slightly over-authored

**What:** The briefing combines a thick left accent, shadow, rounded warm card, sparkle icon, uppercase eyebrow, refresh button, bounded scroll, scenic background, and character art.

**Why it matters:** Each treatment is defensible alone, but together they give a secondary generated message enough weight to compete with the quest. This is where the detector’s lone `side-tab` warning has limited supporting value.

**Fix:** Keep the unmistakable Lory cue but remove one or two layers. A small portrait plus a quiet full border, or a subtle speech-tail treatment without the thick accent, would preserve specificity. Do not flatten it into a generic notification card.

**Suggested command:** `$impeccable polish`

## Persona Red Flags

### Jordan — Confused First-Timer

Jordan opens Home and may first encounter a daily check-in modal before understanding Home. After dismissal, four resource icons show values without visible names; “World 01 / Trail map,” streak shields, energy, coins, and the distinction between a trail and a Daily Quest all assume game-language familiarity. The most important instruction—tap or hold to start/complete the quest—is below the greeting and six-option habit selector. Jordan can identify the bottom tabs, but may not know which of the many opening actions is the intended first step.

### Sam — Accessibility-Dependent User

Sam can benefit from labeled bottom tabs, selected habit state, button labels/hints, disabled states, and reduced-motion support. The flow still breaks down at the 28×28 refresh/settings pressables, fixed-height one-line habit chips, potentially clipped resource capsule, and fixed/overflow-hidden hero under large text. Visual progress bars do not expose equivalent progress semantics, and Lory’s image intent is not explicit to assistive technology. A linear screen-reader traversal also reaches substantial greeting/configuration content before the quest action.

### Casey — Distracted Mobile User

Casey wants one thumb-reachable action and quick resumption. Persistent bottom tabs and the full-width quest CTA are good once reached, but the auto-open check-in modal, large hero, and active-habit card delay it. At 321 px, resource clipping can hide the state needed to understand whether a timed quest is available. Six small habit chips demand a deliberate scan, and settings/refresh/map affordances create additional exits from the daily loop. Interruption recovery is helped by durable quest/timer state, but the re-entry hierarchy does not bring that state forward.

## Minor Observations

- “Active habits” followed by “Choose your trail” reads like management copy; “Today’s trail” or a direct selected-habit heading would better support the daily task.
- `World 01 / Trail map` is styled like an interactive locator but has no press behavior. Make it plain metadata or turn it into the map link.
- The `|` delimiter in chapter/day metadata reads like implementation punctuation. A centered dot or natural-language phrase would feel more finished and improve spoken output if exposed.
- The Active Habit grid’s three-column density is efficient for short English labels but does not leave room for localization or enlarged text.
- The bottom navigation is one of the strongest recognizability decisions: all five icons retain labels and selected state uses shape, position, color, and semantics rather than color alone.
- Source evidence shows strong offline and retry copy through `SyncStatusBanner`; preserving the previous snapshot during failure is the correct emotional and functional choice.

## Questions to Consider

1. If Home could show only one large object above the fold, should it be Lory’s scenery or today’s quest?
2. Is daily check-in meant to be a welcome ritual the player chooses, or a gate they must dismiss before every daily task?
3. Could the six-habit selector become part of the quest card so selection and action read as one continuous sentence?
4. What information must remain permanently visible in the resource bar, and what can appear only when a resource is low, refilling, or tapped?
5. How much of Loro’s distinctiveness comes from the oversized hero, versus the more defensible combination of Lory’s voice, pixel art, trail progress, and tactile quest action?

---

## Implementation Addendum — 2026-07-29

This addendum records the `$impeccable layout` implementation completed after the critique. The original **25/40** score and issue descriptions above remain unchanged as the pre-implementation baseline. A new score requires a separate rendered critique pass.

### Resolution Matrix

| Original issue | Status | Resolution |
|---|---|---|
| **[P1] The Daily Quest is buried below secondary content** | **Resolved in source** | Home now reads Resources → compact greeting → selected trail and existing 2×3 habit grid → Daily Quest → full Lory briefing → Adventure Map. The primary quest action now precedes the generated briefing and progression content in visual, touch, and assistive-technology order. |
| **[P1] The compact-width and large-text layout is mathematically brittle** | **Partially resolved** | Removed the fixed 290 px pre-quest hero, changed the briefing to a content-driven minimum-height surface, widened the Home resource lane beyond the main card gutter, converted habit controls from fixed height to minimum height, and allowed two-line habit labels. Shared `ResourceBar`, `DailyQuestCard`, and `AdventurePathPreview` extremes still require a rendered `$impeccable adapt` pass. |
| **[P1] Important icon controls miss the 44×44 interaction floor** | **Resolved for Home-local controls** | The briefing refresh and habit-target settings actions now use compact 28 px visual marks inside 44×44 pressable regions. Trail progress exposes an accessible label and current percentage. Decorative scenic and Lory art in the briefing are explicitly removed from the accessibility tree. |
| **[P2] The daily check-in and ambient motion compete with the primary loop** | **Not addressed** | The daily check-in auto-modal and unclaimed-gift nudge remain unchanged because this task was limited to Home hierarchy. This remains a valid `$impeccable distill` follow-up. |
| **[P3] Lory’s briefing surface is slightly over-authored** | **Resolved in source** | Removed the thick one-sided accent, eliminated the fixed oversized hero treatment, reduced Lory from `lg` to `md`, retained one quiet full border, and moved the full scenic briefing below the quest without removing product-specific art or voice. |

### Implemented Home Hierarchy

```text
Resources
   ↓
Compact time-aware greeting
   ↓
Choose a trail
Existing 2×3 at-a-glance habit grid
   ↓
Daily Quest
Primary tap or hold action
   ↓
Lory’s full generated/fallback briefing
   ↓
Adventure Map
```

### Source Changes

#### `src/screens/home/index.tsx`

- Split the previous `HeroGreeting` into two purpose-specific local components:
  - `HomeGreeting` owns the time-aware greeting, player name, weather icon, and “Your trail is waiting.”
  - `LoryBriefingCard` owns generated/fallback copy, refresh limits, loading state, reduced-motion animation, scenic background, and canonical Trail Captain art.
- Moved `DailyQuestCard` ahead of the full Lory briefing and Adventure Map.
- Preserved the roadmap-mandated 2×3 Home habit grid rather than adding a duplicate horizontal switcher.
- Compressed `ActiveHabitCard` into one selected-trail header, progress cue, settings action, and the existing daily-status grid.
- Removed duplicate “Active habits”/selected-habit header chrome while retaining the active habit name and section/day context.
- Changed habit controls from fixed `h-11` to `min-h-11` and permitted two-line labels.
- Gave the resource row a wider viewport-aware lane while keeping ordinary cards inside the existing bounded 20 px-gutter content column.
- Replaced the fixed `h-hero`/`overflow-hidden` composition with a content-driven `min-h-44` briefing surface.
- Reserved layout space for Lory rather than allowing the mascot to overlap the briefing content without compensation.
- Enlarged Home-local refresh and settings pressable regions to 44×44.
- Added an accessible progress-bar label and current percentage for the selected trail.
- Removed the non-interactive “World 01 / Trail map” treatment; the actual Adventure Map remains the explicit map destination.
- Replaced the chapter/day pipe delimiter with a centered dot.
- Removed the detector-flagged `border-l-4` briefing accent.

#### `docs/PLANS.md`

- Updated completed Feature #1 implementation notes to record the choose-then-act Home hierarchy while preserving the feature’s status and 2×3 grid contract.

#### `docs/history/2026-07.md`

- Added a factual “Home Quest-First Hierarchy” entry covering behavior, preserved contracts, verification, and the unavailable rendered comparison.

### Behavior Explicitly Preserved

The layout change did **not** alter:

- Quest eligibility or once-per-date completion
- Tap/hold quest interactions
- Timed-quest duration enforcement
- One-time quest behavior
- Rewards, coins, XP, energy, streaks, shields, loot, or Adventure Path mutations
- Active-habit selection and enabled-habit ordering
- Authenticated/guest repository behavior
- Supabase contracts or persistence
- Lory briefing generation, caching, fallback, refresh limits, or four-line bounded viewport
- Loading, offline, disabled, completed, and adventure-complete quest states
- Daily check-in behavior
- Celebration sequencing and loot item details
- Adventure Path navigation
- The five persistent primary tabs

### Verification Performed

- `npm run typecheck` — passed.
- Pre-edit Impeccable layout detector — `[]`.
- Post-edit Impeccable layout detector — `[]`.
- Expo production web export — passed through Metro and NativeWind.
  - 1,090 modules bundled.
  - Production JavaScript, CSS, HTML, metadata, fonts, images, and sounds generated successfully.
- `git diff --check` for the changed Home and documentation files — passed.
- Temporary Expo export directory — removed after verification.
- Automation ports `8082` and `8083` — no listeners left running.
- Reserved manual Expo port `8081` — untouched.

### Verification Limitation

A rendered 321×677 comparison was not available:

- The connected browser inventory returned `[]`.
- No browser tab, screenshot, visual overlay, or device interaction could be created.
- The sandboxed Expo development server could not spawn Metro/NativeWind workers; the production export succeeded when Metro was allowed to run outside the sandbox.

The production bundle proves the implemented source compiles through the real Expo/Metro/NativeWind pipeline, but it does not replace visual testing on Android, iOS, or a mobile-sized browser.

### Remaining Follow-Up

1. Run `$impeccable adapt` for the shared resource capsule, Daily Quest reward/timer rows, and Adventure Map header at 321 px and large-text settings.
2. Exercise Home on Android and iOS for safe areas, 44/48 px touch behavior, reduced motion, and persistent-tab clearance.
3. Verify long player names, localized habit labels, four-line briefings, timed quests, completed quests, offline state, zero energy, all chapters complete, and an absent Adventure Map.
4. Run `$impeccable distill` if the automatic daily check-in modal and competing ambient cues should be removed from the opening loop.
5. Run a new `$impeccable critique src/screens/home/index.tsx` only after rendered verification is available; record the new score as a separate snapshot rather than overwriting this baseline.
