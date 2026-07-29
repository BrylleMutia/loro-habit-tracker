# Loro - Gamified Habits Product Guide

> **Purpose:** Define the product experience, game-loop rules, terminology, voice, and non-negotiable UX principles.
>
> **Engineering architecture:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)  
> **Feature roadmap:** [`PLANS.md`](./PLANS.md)  
> **Agent workflow:** [`../AGENTS.md`](../AGENTS.md)

## Product Overview

`Loro - Gamified Habits` turns everyday habits into short adventure quests. Players choose a habit, complete one clear daily action, receive immediate rewards and encouragement, and advance that habit's trail.

The experience should feel:

- Friendly, compact, and easy to scan
- Game-inspired without turning self-care into tedious grinding
- Encouraging without guilt or punishment
- Rewarding without obscuring the real-world habit
- Calm enough for daily use and expressive enough for meaningful milestones

Lory, the blue/red/green pixel-art Trail Captain, is the companion who explains the trail, celebrates progress, and offers short contextual guidance.

## Product Principles

1. **Protect the habit loop.** Every feature should support “choose a habit → complete one clear quest → receive feedback → advance the trail.”
2. **Encourage without guilt.** Missing a day can affect streak effectiveness but never removes earned path progress. Copy should welcome the player back without shame.
3. **Keep daily actions minimal.** A Daily Quest uses one primary hold or tap action. Optional notes, item details, and navigation choices happen after completion.
4. **Make game rules understandable.** Rewards, energy costs, streak protection, item effects, and eligibility must be visible and deterministic.
5. **Use progression as encouragement.** XP, coins, paths, equipment, Guild quests, and collections reinforce consistency; they do not replace the habit itself.
6. **Avoid pay-to-win pressure.** Real-money offerings should be cosmetic or supporter-oriented and must not sell habit completion, streak protection, energy, or loot advantage.
7. **Keep social features supportive and private.** Future social features are opt-in and share a purpose-built summary rather than exact activity, private notes, email, or raw habit history.
8. **Use Lory intentionally.** Lory appears for guidance, celebrations, thoughtful empty states, and reminders—not as decoration that competes with the current action.

## Current Habit Set

The application currently has six fixed habits:

| Habit | Quest type | Daily target | Default interaction | Energy |
|-------|------------|--------------|---------------------|--------|
| Exercise | Timed | Chapter-defined minutes | Start the in-app timer and complete the required duration | Costs energy |
| Reading | Timed | Chapter-defined minutes | Start the in-app timer and complete the required duration | Costs energy |
| Journaling | Timed | Chapter-defined minutes | Start the in-app timer and complete the required duration | Costs energy |
| Water | One-time | 6 glasses | Confirm the predetermined daily target | No energy required |
| Sleep | One-time | 8 hours | Confirm the predetermined daily target | No energy required |
| Outdoors | One-time | 10 minutes | Confirm the predetermined daily target | No energy required |

Timed quests measure elapsed in-app time. One-time quests remain intentionally binary: the application records the player's confirmation and does not claim to verify each glass, minute, or external action.

The first target-customization release should therefore enforce timed-duration overrides only. One-time targets can be displayed as guidance, but must not be presented as technically counted unless the product deliberately adds a different interaction model.

## Core Daily Game Loop

1. The player opens Home and sees Lory's briefing, resources, and today's habit status.
2. The player chooses one of the six habits.
3. The active Daily Quest shows one primary action:
   - Hold/start and complete a timer for a timed quest.
   - Tap to complete a one-time quest.
4. A successful completion atomically awards the configured coins and XP, updates streaks, records activity, advances exactly one path node for that habit, and may award loot or advance Guild quests.
5. The completion experience shows rewards and streak feedback, then offers a concise next action.
6. The player may continue to another unfinished habit, inspect the path, or finish for the day.

Each habit has no more than one completable Daily Quest per local calendar date.

## Adventure Paths and Chapters

- Each habit owns an independent completion-based Adventure Path.
- Paths are divided into seven-node chapters.
- One node represents one completed day for that habit, not one step inside a single day's quest.
- Completing today's quest advances only that habit by one node.
- Future nodes remain locked until the current node is complete and a new local day begins.
- Missing a day never removes completed nodes or claimed chapter rewards.
- Completing node seven makes the chapter reward claimable.
- A chapter reward can be claimed only once.
- Additional chapters and a future recurring/prestige path must preserve historical progress and use a cycle-aware server schema rather than overwriting earlier completion rows.

## Progression and Resources

### XP and Levels

- Quest and chapter rewards grant XP.
- Level changes are derived from authoritative XP rules and surfaced as explicit mutation outcomes.
- A level-up is a distinct celebration from an individual quest or chapter completion.

### Coins

- Coins are earned through approved game rewards.
- Economy mutations such as purchases or salvage must be transactional and retry-safe.
- The client never supplies authoritative prices, reward values, or coin balances.

### Energy

- Guided timed quests consume energy when they start.
- Water, Sleep, and Outdoors remain usable at zero energy.
- Energy regenerates according to the canonical game rules and server clock.
- The UI should explain the next refill without implying a refill has happened before the authoritative state confirms it.

### Streaks

- Each habit has an independent streak.
- The app-wide streak advances only on the first completed habit of a local date.
- A second habit completed on the same date must not increment the app-wide streak again.
- A missed day can reset effective streak continuity but never removes path progress.
- A declared Campfire rest day takes precedence over streak-shield consumption.
- One shield protects the eligible streak outcome for one completion and cannot be consumed manually or retroactively.

### Loot and Equipment

- Loot is generated from server-authoritative eligibility and weighting for signed-in users, with equivalent deterministic rules for guests.
- Equipment is collectible and equippable; item attributes are currently descriptive/collection-oriented unless a future product decision explicitly adds a capped gameplay effect.
- Discovery history survives selling, salvaging, or losing an inventory instance.
- Item art, rarity, stats, and source should be understandable without requiring the player to memorize another item.

### Guild Quests

- Guild quests connect normal habit activity to broader short- and long-period goals.
- Progress is derived from the same durable completion facts as the core game.
- Available, accepted, in-progress, completed, and claimed states must be visually distinct.
- Guild copy and targets must reflect all six current habits.

## Navigation and Information Architecture

The application has five persistent primary tabs:

| Tab | Primary purpose |
|-----|-----------------|
| Profile | Identity, equipped appearance, concise lifetime summary, and future achievements/social entry |
| Stash | Inventory, equipment, collection interaction, and the future earned-coin Shop |
| Home | Lory briefing, resources, daily status, Daily Quest, and Adventure Path |
| Guild | Guild quest discovery, progress, rewards, and history |
| More | Statistics, Catalog, Settings, privacy/help, and account controls |

Do not add a sixth bottom tab without a deliberate product-level navigation redesign. New destinations should normally live inside the closest existing tab.

Home may switch locally between the dashboard and an Adventure Path view. Transient Home view state should not become durable game state.

## Lory's Role and Voice

Lory is the friendly Trail Captain.

Lory's writing should be:

- Short, warm, and specific
- Supportive rather than commanding
- Positive without exaggerated praise
- Welcoming after inactivity
- Clear about one useful next action
- Free from medical claims, guilt, invented rewards, or invented app actions

The daily AI briefing covers the whole app rather than one message per habit. AI may phrase an insight or tip, but deterministic application code or server read models decide:

- Current game facts
- Pending actions
- Completion and streak statistics
- Reward eligibility
- Streak risk
- Notification timing
- The priority action supplied to the model

Guest, offline, malformed, or failed AI requests use a concise local fallback.

## Completion and Celebration Experience

Celebration intensity should match the milestone:

1. Daily Quest completion
2. Loot reveal
3. Level-up
4. Chapter completion
5. Achievement unlock

These events must be sequenced through a shared coordinator so they do not compete or open nested native modals.

After the reward sequence, present no more than three clear choices:

- Continue to the next unfinished trail
- View the completed habit's path
- Done

If all available habits are complete, use a calm “all trails cleared” acknowledgment rather than adding pressure or an unplanned perfect-day reward.

## Visual and Interaction Direction

- Use a light pastel canvas, warm off-white cards, pastel-blue primary actions, and restrained green/red/gold reward states.
- Use the shared `rounded-card` token for cards and avoid excessive pills or nested card surfaces.
- Home presents energy, streak, shields, and coins in one compact segmented capsule at the top-left; daily check-in remains an adjacent, visually separate action.
- Preserve compact layouts, stable dimensions, and clear visual hierarchy on narrow mobile screens.
- The onboarding habit selector uses a calm blue-to-white canvas, compact selectable habit rows with distinct icon colors, an explicit selected-count badge, and persistent Continue/Skip actions that remain reachable on narrow screens.
- Lory's briefing card shows no more than four message lines at once; longer generated briefings scroll within the card without moving the surrounding Home layout.
- Use semantic status icons and text; do not communicate status with color alone.
- Keep timers and counters visually stable with tabular numerals.
- Respect safe areas, large text, and at least a 44×44 effective touch target.
- All ambient, repeated, and celebration motion must respect the system reduced-motion setting.
- Loading, empty, error, offline, permission-denied, disabled, and retry states are part of the product experience.

## Art and Asset Direction

- `src/assets/images/parrot-trail-captain.png` is the canonical reusable Lory mascot.
- Preserve approved high-fidelity pixel art; do not replace it with generic styled blocks.
- Character, avatar, equipment, and layered art should normally use transparent images with crisp pixel edges and `resizeMode="contain"`.
- Composite Home art must preserve the complete intended scene rather than cropping Lory or terrain.
- Reusable assets are registered centrally instead of repeating `require()` calls across screens.
- Sound effects should be brief, responsive, and subordinate to the action. Settings must be able to disable them.

## Product Boundaries

Unless the roadmap explicitly changes these decisions:

- Daily Quests do not contain free-form input, counters, or multi-step checklists.
- Missing days do not remove Adventure Path progress.
- AI does not mutate game state or invent application facts.
- Client code does not determine authoritative rewards or economy values.
- Real money does not purchase gameplay advantage.
- Social features do not expose private habit history.
- Gear attributes do not reduce real-world habit requirements.
- New primary navigation destinations do not automatically become bottom tabs.

## Documentation Ownership

- This file owns stable product intent, terminology, game rules, tone, and UX boundaries.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) owns engineering and delivery standards.
- [`PLANS.md`](./PLANS.md) owns feature scope, priority, status, and dependencies.
- [`history/README.md`](./history/README.md) indexes monthly implementation history and significant decisions.
- Source code, tests, migrations, and deployed configuration remain the final truth for current implementation behavior.
