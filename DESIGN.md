# Loro Temporary UI/UX Guide

> **Status:** Temporary, non-canonical working standard.
>
> **Audience:** Product and design reviewers, engineers, and implementation agents.
>
> **Purpose:** Define the intended app-wide visual and interaction direction using the redesigned onboarding habit selector as the clearest current reference. This guide describes the target direction; it is not an audit of every existing screen.

## Authority and Source of Truth

Use this document to make visual-composition and interaction decisions. It supplements, but does not replace, the canonical product and engineering documentation.

When guidance conflicts, use this order:

1. [`docs/PRODUCT.md`](./docs/PRODUCT.md) for product rules, terminology, accessibility boundaries, Lory's voice, and stable UX intent.
2. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for engineering, state ownership, persistence, security, and delivery constraints.
3. Shared tokens, components, and current source code for implemented contracts.
4. This temporary guide for app-wide visual composition and interaction guidance.

The principal implementation sources are:

- [`src/constants/themeTokens.js`](./src/constants/themeTokens.js) for shared colors, dimensions, radii, and effects.
- [`tailwind.config.js`](./tailwind.config.js) for NativeWind semantic utilities.
- [`src/constants/colors.ts`](./src/constants/colors.ts) for runtime color aliases used by icons, gradients, Reanimated, and native APIs.
- [`src/styles/shadows.ts`](./src/styles/shadows.ts) for platform-aware elevation.
- [`src/screens/onboarding/index.tsx`](./src/screens/onboarding/index.tsx) for the habit-selector reference composition.
- [`src/components/QuestActionButton.tsx`](./src/components/QuestActionButton.tsx) for primary action behavior and presentation.

Prefer extending a semantic token or meaningful shared component when a reusable need is missing. Do not solve repeated design needs with isolated hex values, one-off radii, or duplicated interaction components.

## Experience Principles

Loro should feel:

- **Calm and friendly.** Use light pastel canvases, warm cards, concise copy, and generous-enough breathing room without making screens sparse.
- **Compact and scannable.** A player should understand the screen hierarchy and next action in a few seconds.
- **Adventure-inspired, not cluttered.** Game language and rewards should make habit progress expressive without hiding the real-world action.
- **Focused.** Each task surface has one dominant primary action. Supporting choices remain visually secondary.
- **Encouraging without guilt.** Missing activity is handled with a welcoming next step, never shame, pressure, or lost earned path progress.
- **Clear about state.** Selected, active, completed, disabled, locked, loading, error, and offline states must be distinguishable without relying on color alone.
- **Stable and flexible.** Layouts remain composed on narrow phones but grow or scroll when text, content, or accessibility settings require more room.
- **Consistent, not mechanically identical.** Shared hierarchy, tokens, states, and interaction rules create coherence. Dashboard, focused-flow, management, and celebration surfaces may use different compositions when their jobs differ.

### The habit-selector hierarchy

The onboarding habit selector is the baseline for focused-flow hierarchy:

1. Quiet canvas
2. Compact navigation or progress
3. Concise page heading
4. No more than two short lines of guidance
5. Optional explicit state or count summary
6. Compact selectable or actionable content
7. One full-width primary action
8. Optional low-emphasis secondary action

This hierarchy generalizes to onboarding, authentication, setup, and other single-purpose flows. It does not require every dashboard or management screen to center its content or use selector-sized rows.

## Visual Foundations

### Color system

Use semantic roles rather than choosing colors by appearance alone. NativeWind classes are the default for normal component styling. Runtime aliases from `colors.ts` are reserved for APIs that cannot consume class names.

#### Core palette

| Role | Semantic token or utility | Value | Intended use |
|---|---|---:|---|
| Primary content | `content.DEFAULT` / `text-content` | `#0B2551` | Body content, card titles, important labels |
| Strong content | `content.strong` / `text-content-strong` | `#111D35` | Page titles and strongest hierarchy |
| Muted content | `content.muted` / `text-content-muted` | `#6D7890` | Supporting copy and secondary metadata |
| Subtle content | `content.subtle` / `text-content-subtle` | `#7E899B` | Inactive navigation and low-emphasis labels |
| Primary blue | `primary.DEFAULT` / `bg-primary` | `#56A6F7` | Primary controls and active emphasis |
| Strong action blue | `primary.strong` / `bg-primary-strong` | `#2F80ED` | Selected outlines, strong actions, progress |
| Soft primary | `primary.soft` / `bg-primary-soft` | `#E7F4FF` | Icon tiles and low-intensity blue emphasis |
| Pale primary | `primary.pale` / `bg-primary-pale` | `#DFF5FF` | Canvas transitions and soft information states |
| Warm card | `surface.card` / `bg-surface-card` | `#FFFDF7` | Default card, modal, and control surface |
| Soft surface | `surface.soft` / `bg-surface-soft` | `#F8FBF3` | Quiet secondary surface |
| Panel surface | `surface.panel` / `bg-surface-panel` | `#F3F8FB` | Meaningful nested information panel |
| Blue surface | `surface.blue` / `bg-surface-blue` | `#F4FAFF` | Selected and informational card surface |
| Disabled surface | `surface.disabled` / `bg-surface-disabled` | `#F6F8F9` | Disabled controls and unavailable content |
| Default line | `line.DEFAULT` / `border-line` | `#E6EDF2` | Neutral boundaries and dividers |
| Blue line | `line.blue` / `border-line-blue` | `#D8EAF4` | Quiet blue boundaries |
| Disabled line | `line.disabled` / `border-line-disabled` | `#D8E1E8` | Disabled control boundary |
| Overlay | `overlay` | `rgba(11, 37, 81, 0.42)` | Modal and focused-layer backdrop |

#### Semantic and reward palette

| Meaning | Strong color | Soft surface | Usage |
|---|---:|---:|---|
| Success | `#56C878` | `#E9F8EE` | Completed quests, successful confirmation, earned progress |
| Danger | `#F46F64` | `#FFF0EC` | Errors, destructive actions, and risk requiring attention |
| Reward | `#F5B739` | `#FFF3D6` | Coins, reward emphasis, and earned-value moments |
| Common rarity | `#A96F45` | `#F7EBDD` | Common equipment and discovery state |
| Uncommon rarity | `#4C8060` | `#E7F4E6` | Uncommon equipment and discovery state |
| Rare rarity | `#4D9CEB` | `#E6F3FF` | Rare equipment and discovery state |
| Epic rarity | `#9A72DF` | `#F1EAFE` | Epic equipment and discovery state |
| Legendary rarity | `#EAB52F` | `#FFF3C7` | Legendary equipment and discovery state |

#### Color rules

- Use semantic NativeWind classes for ordinary layout and text styling.
- Use `colors.ts` only for icons, gradients, native props, SVG, Reanimated styles, and other runtime-only APIs.
- Do not add a raw color when an existing semantic role expresses the same meaning.
- Pair status color with a label, icon, checkmark, border, or shape change.
- Use strong blue for actions and selection, not large decorative backgrounds.
- Reserve green for confirmed success, red for errors or destructive intent, and gold for earned value or rewards.
- Use rarity colors only when rarity is the information being communicated.
- Do not place body copy in low-contrast pastel colors. Verify contrast when introducing a new token or text/background combination.

### Typography

The current type system uses the platform system font. Weight, size, line height, and spacing create hierarchy.

| Role | Preferred NativeWind treatment | Guidance |
|---|---|---|
| Focused-flow page title | `text-xl font-black text-content-strong` | Centered, short, and normally one line |
| Dashboard or modal title | `text-2xl font-black text-content` | Use when the surface needs stronger presence |
| Section heading | `text-lg` or `text-xl font-black text-content` | Left-aligned on dashboards and management screens |
| Standard card title | `text-sm` or `text-base font-black text-content` | Choose the smallest size that preserves hierarchy |
| Compact-row title | `text-xs font-black text-content` | Appropriate for dense selector-style rows |
| Body copy | `text-sm font-semibold leading-5 text-content-muted` | Default explanatory and descriptive copy |
| Compact supporting copy | `text-xs font-semibold leading-4 text-content-muted` | Short card or focused-flow descriptions |
| Metadata | `text-xs font-bold text-content-muted` | Dates, targets, progress context, and secondary facts |
| Microcopy | `text-micro font-bold` | Bottom-tab labels and genuinely bounded metadata only |
| Action label | `text-xs` or `text-sm font-black` | Keep short and verb-led |

Typography rules:

- Use black or extrabold weights for short headings and action labels.
- Use semibold or bold weights for body and supporting text.
- Keep headings action-oriented and concise.
- Aim for one or two supporting lines in focused flows. Let content-driven screens grow when the information cannot be safely shortened.
- Use uppercase only for short eyebrows, categories, or status labels; do not uppercase sentences.
- Allow intentional wrapping. Do not reduce important text to unreadable sizes merely to preserve a fixed height.
- Use tabular numerals for timers, resource counters, cooldowns, and changing statistics so surrounding layout remains stable.

### Spacing and density

Use a compact 4 px-based rhythm. Favor 8, 12, 16, and 20 px relationships; use half steps such as 10 px only where compact repeated rows benefit from them.

| Context | Reference value |
|---|---:|
| Standard horizontal screen gutter | 20 px |
| Standard maximum content width | 600 px |
| Narrow focused-flow maximum width | Approximately 420 px |
| Compact row gap | 8–10 px |
| Card internal padding | 12–16 px |
| Section separation | 16–20 px |
| Primary action separation | 20–28 px, based on viewport fit |

Numeric dimensions in this guide are current reference values, not immutable product rules. Semantic tokens, content requirements, and accessibility take precedence.

Avoid large empty regions that push the task's primary action below the initial mobile viewport. Do not compress content until it becomes hard to scan; when both content and actions cannot fit safely, make the screen scroll.

### Shape and elevation

- Use `rounded-card` for the standard 8 px card, field, button, and icon-tile radius.
- Use `rounded-pill` for compact counters, segmented resources, short status badges, and circular controls.
- Use the shared `shadows.card` helper for ordinary elevated surfaces. Its reference web effect is `0 8px 18px rgba(122, 167, 191, 0.12)`.
- Keep elevation soft and functional. A shadow separates a surface from the canvas; it should not make every element appear to float.
- Prefer one clear card boundary over several nested bordered surfaces.
- Add a nested surface only when it communicates a meaningful information or state hierarchy.

### Iconography and art

- Use Ionicons when an appropriate symbol exists.
- Ordinary UI icons should identify or reinforce a label, not compete with it.
- Place category icons on soft semantic tiles when this improves scanning.
- A compact category tile may use a 32 px square with an approximately 18 px icon.
- Interactive icon-only controls need an accessible label and at least a 44×44 effective touch target.
- Preserve approved pixel art, transparency, crisp edges, and complete image bounds.
- Use the canonical Trail Captain artwork registered through the shared image constants.
- Use Lory for guidance, celebrations, meaningful empty states, and reminders—not as decoration beside every action.

## Layout and Information Hierarchy

### Screen frames

- Respect platform safe areas and use a light-first pastel canvas.
- Keep high-priority content near the top without crowding the status bar or system controls.
- Center the content column when the viewport exceeds its maximum width.
- Use the shared 600 px maximum content width for ordinary screens and an approximately 420 px maximum for narrow focused flows.
- Use flexible `ScrollView` or `FlatList` layouts when content may grow.
- Prefer `flexGrow` for short scroll views that should fill the viewport without forcing a fixed content height.
- Avoid fixed full-screen content heights that can clip translated text, large text, keyboard-open forms, or bottom actions.
- Preserve bottom clearance for the persistent tab bar and device safe area.

### Alignment by task type

| Surface type | Default alignment | Examples |
|---|---|---|
| Focused flow | Centered heading and guidance; full-width action | Onboarding, authentication, initial setup |
| Dashboard | Left-aligned sections with compact summary controls | Home, Profile |
| Management or collection | Left-aligned hierarchy with filters or grouped rows | Stash, More, Guild history |
| Modal or celebration | Centered milestone content; explicit action order | Quest completion, loot, confirmation |
| Detail view | Left-aligned title, facts, and next action | Habit path, equipment details |

Centered composition is a focused-flow tool, not an app-wide requirement.

### Navigation

Preserve the five primary tabs:

1. Profile
2. Stash
3. Home
4. Guild
5. More

Do not add a sixth bottom tab for a local feature. Place new destinations inside the closest existing tab unless a product-level navigation redesign is explicitly approved.

Communicate the active tab through a combination of icon position, shape, color, and label state. Keep the tab bar stable while content changes.

## Component Grammar

These recipes describe intended composition. Reuse a shared component when one already owns the behavior.

### Page headers

A focused-flow header contains:

- A compact back control at the leading edge
- Centered progress when the flow has a known finite sequence
- A balancing trailing placeholder or forward control when needed
- One strong page title
- Minimal guidance below the title

The habit selector uses an approximately 28 px circular visual back control with 8 px hit slop, producing a 44×44 effective target. Larger controls may use a visible 44×44 surface directly.

Do not place decorative art or multiple controls beside a focused page title when they compete with the next action.

### Cards

Default card recipe:

`rounded-card border border-line-blue bg-surface-card` plus `shadows.card`

Cards should:

- Use a warm off-white surface.
- Have one clear title/supporting-text hierarchy.
- Use 12–16 px internal padding for ordinary content.
- Keep borders restrained and use semantic border colors for meaningful states.
- Avoid nesting another full card unless the inner panel communicates a distinct fact, state, or action.

### Selectable rows

The onboarding habit row is the reference for compact selectable content:

| Element | Current reference |
|---|---:|
| Row minimum height | Approximately 56 px |
| Icon tile | 32×32 px |
| Icon | Approximately 18 px |
| State control | 20×20 px |
| Repeated-row gap | Approximately 10 px |

Selected recipe:

`min-h-14 rounded-card border border-primary-strong bg-surface-blue`

Unselected recipe:

`min-h-14 rounded-card border border-transparent bg-surface-card`

Selection must change more than color:

- Add the strong-blue outline.
- Use the pale-blue selected surface.
- Show a checkmark inside the state control.
- Expose checkbox or selected state to assistive technology.

Rows are minimum-height surfaces, not fixed-height containers. They may grow for large text and must remain reachable through scrolling. Selection counts and order are behavior rather than styling assumptions; layouts must support any valid catalog-driven count.

### Buttons and action hierarchy

Use the shared primary action component when its behavior fits.

| Level | Treatment | Usage |
|---|---|---|
| Primary | Solid blue, high-contrast label, strong press feedback | The single next action on the task surface |
| Secondary | Outlined, soft-surface, or low-emphasis text treatment | Optional navigation or an alternative that does not compete |
| Destructive | Explicit danger color and consequence-aware copy | Delete, reset, remove, or irreversible account actions |
| Disabled | Muted but legible surface, label, and semantic disabled state | Temporarily or logically unavailable action |

Reference heights:

- Standard action: approximately 48 px
- Compact action: approximately 40 px
- Effective interactive target: at least 44×44 px

Button rules:

- Use one dominant primary action per task surface.
- Keep labels short, verb-led, and specific.
- Leading icons identify an action; trailing arrows communicate forward navigation.
- Do not replace text with an icon when the action is not universally understood.
- Show loading without changing the control's outer dimensions.
- Preserve explicit disabled state and explain the reason nearby when it is not obvious.
- Require confirmation for materially destructive actions.

### Badges and pills

Use pills for:

- Short counts
- Compact resources
- Bounded status labels
- Small pieces of metadata

Do not wrap ordinary sentences, descriptions, or entire card sections in pill shapes. A pill should remain quickly scannable at its longest supported value.

### Forms

- Keep field labels persistent; do not rely on placeholders as the only label.
- Use readable inline validation near the affected field.
- Distinguish validation, server, offline, and permission errors where the recovery differs.
- Keep one clear submit action.
- Preserve entered values after recoverable failures.
- Make form layouts keyboard-safe and scrollable.
- Keep loading and disabled states explicit and stable.
- Ensure password, verification, and account-recovery instructions remain concise and specific.

### Resource displays

- Present energy, streak, shields, and coins in one compact segmented capsule.
- Keep resource order and dimensions stable while values change.
- Use dividers to separate values without turning each value into a separate floating card.
- Use icons, values, and accessible labels together.
- Keep daily check-in as a visually separate adjacent action.
- Explain a pending refill or cooldown without implying the underlying state has changed before authoritative confirmation.

### Briefings and generated text

- Keep Lory's daily briefing concise and focused on one useful next step.
- Show no more than four message lines at once.
- Put longer generated or fallback text in a bounded internal scroll viewport.
- Keep the heading, thinking state, refresh action, error state, and retry control outside the scrolling message area.
- Do not allow generated text to reflow or expand the entire Home hierarchy.
- Deterministic application code supplies facts, rewards, eligibility, and mutations; generated text only phrases approved context.

### Dialogs and bottom sheets

- Use the shared dimmed navy overlay and a focused warm-card surface.
- Keep the title, consequence, supporting detail, and action order explicit.
- Keep critical actions visible while long body content scrolls internally.
- Use a safe-area-aware bottom sheet when the action is contextual and benefits from thumb reach.
- Use a centered modal for focused confirmation or milestone feedback.
- Avoid nested native modals. Queue or close one transient layer before opening another.
- Support platform back behavior and an explicit close path where dismissal is allowed.

### Celebrations

Scale visual intensity by milestone:

1. Daily Quest completion
2. Loot reveal
3. Level-up
4. Chapter completion
5. Achievement unlock

Everyday feedback should be quick and restrained. Higher milestones may use Lory, richer art, confetti, or sequencing, but must:

- Preserve an obvious continuation action.
- Avoid blocking the habit loop longer than necessary.
- Never compete with another modal or celebration.
- Respect reduced motion.
- Retain a complete static presentation when animation is disabled.

## Content and UX Writing

Lory is the friendly **Trail Captain**. Product copy should be:

- Short, warm, and specific
- Supportive rather than commanding
- Positive without exaggerated praise
- Welcoming after inactivity
- Clear about one useful next action
- Free from guilt, medical claims, invented rewards, or unsupported app actions

### Writing patterns

| Situation | Prefer | Avoid |
|---|---|---|
| Return after inactivity | “Welcome back. Your trail is ready when you are.” | “You broke your streak again.” |
| Empty state | Explain what belongs here and give one next step | A generic “Nothing here” with no recovery |
| Recoverable error | State what failed, what remains safe, and what to try | Technical error text or ambiguous blame |
| Offline state | Explain which actions need reconnection | Pretending a server action succeeded |
| Disabled action | Give a nearby reason when it is not obvious | A silent gray button |
| Success | Confirm the completed action and earned result | Unsupported or inflated praise |

Headings should be action-oriented. Supporting copy should normally fit in one or two concise sentences. Longer explanatory content belongs in a detail view, expandable area, or scrollable dialog rather than the primary task surface.

## Accessibility, Responsiveness, and Motion

### Accessibility

- Every interactive control needs an appropriate role, concise label, state, and at least a 44×44 effective target.
- Use `accessibilityState` for selected, checked, disabled, busy, or expanded state where applicable.
- Provide meaningful descriptions for informative images.
- Hide decorative assets from accessibility.
- Preserve a logical screen-reader order matching the visual hierarchy.
- Pair status color with text, iconography, shape, or border changes.
- Give charts textual summaries and accessible values.
- Preserve visible keyboard focus on web and external-keyboard platforms.
- Do not rely on haptics, sound, animation, or color as the only feedback.

### Responsive and large-text behavior

Verify at minimum:

- Narrow mobile viewport
- Safe-area devices
- Large text
- Keyboard-open forms
- Persistent-tab clearance
- Wider tablet or web viewport

Layout rules:

- Use minimum heights instead of fixed heights for text-bearing rows and cards.
- Allow important text to wrap.
- Scroll the screen rather than clipping content or shrinking it below the documented hierarchy.
- Keep primary and recovery actions reachable.
- Center bounded content columns on large viewports instead of stretching cards indefinitely.
- Preserve complete image bounds and intentional aspect ratios.

The 321×677 onboarding reference is a useful compact-layout target, not the only supported viewport.

### Motion, sound, and haptics

- Prefer opacity and transform animation over layout animation.
- Keep ordinary feedback short and subordinate to the action.
- Respect the system reduced-motion preference for ambient, repeated, entering, and celebration effects.
- Reduced motion must provide a complete static state, not an empty placeholder.
- Keep sounds brief and responsive, and respect the app's sound setting.
- Use haptics as reinforcement, never as the only confirmation.

## Interaction State Matrix

Every interactive surface must deliberately consider the applicable states below.

| State | Required visible treatment | Required behavior and semantics |
|---|---|---|
| Default | Clear affordance and readable label | Correct role and concise accessible name |
| Pressed or focused | Opacity, transform, outline, or other bounded feedback | Preserve layout; show keyboard focus where applicable |
| Selected or active | Shape/border/icon plus semantic color | Expose selected or checked state |
| Completed or success | Confirmation icon and label with success treatment | Prevent duplicate mutation where applicable |
| Disabled | Muted but readable surface and label | Disable interaction and expose disabled state |
| Loading or syncing | Stable-size indicator and contextual copy | Prevent accidental duplicate action |
| Empty | Purpose-specific explanation and one useful next step | Do not imply an error when no data is valid |
| Error or retry | Error treatment, preserved safe state, and recovery action | Announce the issue without exposing internal details |
| Offline | Distinct offline explanation and available alternatives | Do not imply a durable mutation completed |
| Locked or permission-denied | Lock/restriction cue and explanation | Prevent interaction and explain how access changes, if applicable |

Not every surface renders every state, but every implementation should make that decision deliberately.

## Anti-Patterns

Avoid:

- Multiple equal-weight primary buttons on the same task surface
- Fixed text-bearing heights that clip translated or enlarged content
- Excessive pills, nested cards, or floating surfaces
- Unexplained icon-only controls
- Raw colors, arbitrary radii, or duplicate shadows scattered through screens
- Status communicated by color alone
- Lory used as decoration beside every action
- Long generated text expanding the entire screen
- Reward animation that blocks the core habit loop
- Nested or competing native modals
- A sixth bottom tab for a local subfeature
- Dense game information that obscures the real-world habit action
- UI copy that invents rewards, eligibility, streak risk, or mutation results
- Disabled, loading, empty, or offline states added only after the happy path

## Design Review Checklist

Before considering a UI change complete, confirm:

- [ ] The task has one obvious primary action.
- [ ] Visual hierarchy is understandable within a few seconds.
- [ ] Semantic tokens and meaningful shared components are used.
- [ ] The layout works on a narrow mobile viewport.
- [ ] Text-bearing content grows or scrolls under large text.
- [ ] Safe areas, keyboard clearance, and the persistent tab bar are respected.
- [ ] Loading, disabled, empty, error, retry, offline, and permission states were considered.
- [ ] Interactive controls have roles, labels, state, and at least a 44×44 effective target.
- [ ] Status is communicated with more than color.
- [ ] Timers, counters, and changing resource values remain visually stable.
- [ ] Motion respects reduced-motion settings and retains a complete static state.
- [ ] Sound and haptics are optional reinforcement.
- [ ] Lory's copy is concise, supportive, specific, and non-guilt-based.
- [ ] Images preserve approved bounds, transparency, and pixel-art quality.
- [ ] Generated text is bounded and cannot destabilize the surrounding layout.
- [ ] Android, iOS, and mobile web receive a visual comparison when the changed surface supports them.

## Maintaining This Temporary Guide

- Treat numeric measurements as reference values unless they are accessibility requirements or shared tokens.
- If a new reusable design need is approved, add or extend a semantic token or shared component before repeating the treatment.
- Do not update this temporary file in place of updating canonical product or architecture documentation.
- When the design direction stabilizes, reconcile durable decisions into `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, shared tokens, and components, then remove this file deliberately.
