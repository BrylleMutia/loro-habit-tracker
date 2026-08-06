# Loro - Development Plans & Feature Roadmap

> **Last updated:** 2026-08-02
> **Version:** 0.3.1
> **Product contract:** [`PRODUCT.md`](./PRODUCT.md)
> **Engineering architecture:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)
> **Development history:** [`history/README.md`](./history/README.md)

## Documentation Routing

Read this index first, then open only the feature contract or decision record required for the task. Do not load every file under `docs/features/`, `docs/decisions/`, or `docs/history/`.

- Current priority and status live in the matrix below.
- Feature scope, implementation notes, and delivery blueprints live in `features/feature-XX.md`.
- Long-running product and engineering decisions live in `decisions/*.md`.
- Monthly implementation history remains in `history/` and is read only for historical or documentation work.

### Status Legend

- **☑ Complete:** Shipped with authenticated Supabase behavior, guest/local parity, required UI states, and verification.
- **◐ Partial:** A usable foundation exists, but one or more required client, server, parity, security, or UX pieces remain.
- **☐ Planned:** Not started or only represented by non-functional placeholders/constants.

---

## Summary Priority Matrix

| Priority | # | Feature | Effort | Impact | Status |
|----------|---|---------|--------|--------|--------|
| 🔴 P0 | [1](features/feature-01.md#feature-1) | Today-at-a-glance habit strip | Low | High | ☑ |
| 🔴 P0 | [2](features/feature-02.md#feature-2) | Energy regeneration countdown timer | Low | High | ☑ |
| 🔴 P0 | [3](features/feature-03.md#feature-3) | Habit quick-switcher (horizontal pill row) | Medium | High | ☑ |
| 🟡 P1 | [4](features/feature-04.md#feature-4) | Streak shield earn & consume mechanics | Medium | High | ☑ |
| 🟡 P1 | [5](features/feature-05.md#feature-5) | Shop tab (shields, potions, charms, cosmetics) | High | High | ◐ |
| 🟡 P1 | [6](features/feature-06.md#feature-6) | Haptic feedback (quest start/complete, level-up) | Low | Medium | ☑ |
| 🟡 P1 | [7](features/feature-07.md#feature-7) | Statistics & insights dashboard (More tab) | Medium | Medium | ◐ |
| 🟡 P1 | [8](features/feature-08.md#feature-8) | Settings UI in More tab (sound, haptics, reminders) | Low | Medium | ◐ |
| 🟡 P1 | [28](features/feature-28.md#feature-28) | Customize habit settings (duration/count per habit) | Medium | Medium | ◐ |
| 🟡 P1 | [33](features/feature-33.md#feature-33) | Post-completion flow ("Continue to next trail") | Low | Medium | ☐ |
| 🟡 P1 | [43](features/feature-43.md#feature-43) | Launch readiness (observability, security, QA, delivery) | High | High | ☐ |
| 🟢 P2 | [10](features/feature-10.md#feature-10) | Push notifications (reminders, streak at risk, energy) | Medium | High | ☐ |
| 🟢 P2 | [11](features/feature-11.md#feature-11) | Achievement/badge system | Medium | Medium | ☐ |
| 🟢 P2 | [12](features/feature-12.md#feature-12) | Level-up celebration modal | Low | Medium | ◐ |
| 🟢 P2 | [13](features/feature-13.md#feature-13) | Dark mode | High | Medium | ☐ |
| 🟢 P2 | [14](features/feature-14.md#feature-14) | Onboarding guided tour / tutorial | High | High | ☐ |
| 🟢 P2 | [15](features/feature-15.md#feature-15) | Path node animation polish (pulse, unlock, chapter burst) | Medium | Medium | ☐ |
| 🟢 P2 | [16](features/feature-16.md#feature-16) | Streak "at risk" visual warning (amber tint at evening) | Low | Medium | ☐ |
| 🟢 P2 | [17](features/feature-17.md#feature-17) | Chapter preview / "Coming Soon" teasers | Low | Low | ☐ |
| 🟢 P2 | [35](features/feature-35.md#feature-35) | Adaptive Lory messages (context-aware briefings) | Medium | Medium | ◐ |
| 🟢 P2 | [36](features/feature-36.md#feature-36) | Chapter completion celebration (distinct from quest/loot) | Medium | High | ☐ |
| 🟢 P2 | [37](features/feature-37.md#feature-37) | Equipment comparison on equip (stat diff) | Medium | Medium | ☐ |
| 🟢 P2 | [38](features/feature-38.md#feature-38) | "New" badge on recently acquired items | Low | Medium | ☐ |
| 🟢 P2 | [39](features/feature-39.md#feature-39) | Pull-to-refresh + skeleton loading states | Medium | Medium | ☐ |
| 🟢 P2 | [40](features/feature-40.md#feature-40) | Guild quest progress toasts + quest history | Medium | Medium | ☐ |
| 🟢 P2 | [41](features/feature-41.md#feature-41) | Tap loot preview in celebration modal for item details | Low | Medium | ☑ |
| 🟢 P2 | [42](features/feature-42.md#feature-42) | Item catalog (all collected items, even sold/lost) | Medium | Medium | ◐ |
| 🟢 P2 | [44](features/feature-44.md#feature-44) | Asset optimization and bundle budgets | Medium | Medium | ☐ |
| 🔵 P3 | [18](features/feature-18.md#feature-18) | Home screen widget (iOS/Android) | High | Medium | ☐ |
| 🔵 P3 | [19](features/feature-19.md#feature-19) | Habit completion notes (optional one-liner) | Low | Low | ☐ |
| 🔵 P3 | [20](features/feature-20.md#feature-20) | Expanded sound design (rarity fanfares, ambient music) | Medium | Low | ☐ |
| 🔵 P3 | [21](features/feature-21.md#feature-21) | Midnight date-roll transition polish | Low | Medium | ◐ |
| 🔵 P3 | [22](features/feature-22.md#feature-22) | Empty state illustrations (Lory variants) | Medium | Low | ☐ |
| 🔵 P3 | [23](features/feature-23.md#feature-23) | Daily/weekly summary at check-in | Medium | Medium | ☐ |
| 🔵 P3 | [24](features/feature-24.md#feature-24) | Calendar heatmap (GitHub-style contribution grid) | Medium | Medium | ☐ |
| 🔵 P3 | [25](features/feature-25.md#feature-25) | IKEA-effect onboarding (habits first, auth later) | Medium | High | ☑ |
| 🔵 P3 | [26](features/feature-26.md#feature-26) | Badge indicators on tab bar | Low | Medium | ☐ |
| 🔵 P3 | [27](features/feature-27.md#feature-27) | Campfire rest days (streak freeze alternative) | Medium | Medium | ☐ |
| 🔵 P3 | [29](features/feature-29.md#feature-29) | SSO login (Google) | Medium | Medium | ☑ |
| 🔵 P3 | [30](features/feature-30.md#feature-30) | Friend/social features | High | Medium | ☐ |
| 🔵 P3 | [31](features/feature-31.md#feature-31) | Landing page / marketing site | High | Medium | ☐ |
| 🔵 P3 | [32](features/feature-32.md#feature-32) | Business model implementation (payments) | High | High | ☐ |
| 🔵 P3 | [34](features/feature-34.md#feature-34) | Duplicate gear salvage for coins | Low | Low | ☐ |

Feature numbering preserves the existing roadmap IDs. Feature #9 is currently unallocated; later entries are not renumbered so historical links and conversation-log references remain stable.

## Roadmap Implementation Contract

- For feature work, read the matrix row and exactly one matching feature contract.
- Read `PRODUCT.md` for game rules, terminology, voice, and UX boundaries.
- Read relevant sections of `ARCHITECTURE.md` for state ownership, persistence, security, testing, and delivery.
- Read a decision record only when the task touches that decision’s subject.
- Source code, tests, migrations, and deployed configuration remain the final truth for current behavior.

## Decision Records

- [`decisions/README.md`](./decisions/README.md) — topic index and selective-reading rules.
- [`decisions/implementation-order.md`](./decisions/implementation-order.md) — recommended delivery sequence.

## Development History

See [`history/README.md`](./history/README.md). History files remain available for historical investigations but are not routine feature context.

## Legacy Anchor Compatibility

The original roadmap anchors remain available as forwarding links so existing bookmarks and references continue to resolve.

<a id="feature-1"></a> [Feature #1](features/feature-01.md#feature-1)
<a id="feature-2"></a> [Feature #2](features/feature-02.md#feature-2)
<a id="feature-3"></a> [Feature #3](features/feature-03.md#feature-3)
<a id="feature-4"></a> [Feature #4](features/feature-04.md#feature-4)
<a id="feature-5"></a> [Feature #5](features/feature-05.md#feature-5)
<a id="feature-6"></a> [Feature #6](features/feature-06.md#feature-6)
<a id="feature-7"></a> [Feature #7](features/feature-07.md#feature-7)
<a id="feature-8"></a> [Feature #8](features/feature-08.md#feature-8)
<a id="feature-10"></a> [Feature #10](features/feature-10.md#feature-10)
<a id="feature-11"></a> [Feature #11](features/feature-11.md#feature-11)
<a id="feature-12"></a> [Feature #12](features/feature-12.md#feature-12)
<a id="feature-13"></a> [Feature #13](features/feature-13.md#feature-13)
<a id="feature-14"></a> [Feature #14](features/feature-14.md#feature-14)
<a id="feature-15"></a> [Feature #15](features/feature-15.md#feature-15)
<a id="feature-16"></a> [Feature #16](features/feature-16.md#feature-16)
<a id="feature-17"></a> [Feature #17](features/feature-17.md#feature-17)
<a id="feature-18"></a> [Feature #18](features/feature-18.md#feature-18)
<a id="feature-19"></a> [Feature #19](features/feature-19.md#feature-19)
<a id="feature-20"></a> [Feature #20](features/feature-20.md#feature-20)
<a id="feature-21"></a> [Feature #21](features/feature-21.md#feature-21)
<a id="feature-22"></a> [Feature #22](features/feature-22.md#feature-22)
<a id="feature-23"></a> [Feature #23](features/feature-23.md#feature-23)
<a id="feature-24"></a> [Feature #24](features/feature-24.md#feature-24)
<a id="feature-25"></a> [Feature #25](features/feature-25.md#feature-25)
<a id="feature-26"></a> [Feature #26](features/feature-26.md#feature-26)
<a id="feature-27"></a> [Feature #27](features/feature-27.md#feature-27)
<a id="feature-28"></a> [Feature #28](features/feature-28.md#feature-28)
<a id="feature-29"></a> [Feature #29](features/feature-29.md#feature-29)
<a id="feature-30"></a> [Feature #30](features/feature-30.md#feature-30)
<a id="feature-31"></a> [Feature #31](features/feature-31.md#feature-31)
<a id="feature-32"></a> [Feature #32](features/feature-32.md#feature-32)
<a id="feature-33"></a> [Feature #33](features/feature-33.md#feature-33)
<a id="feature-34"></a> [Feature #34](features/feature-34.md#feature-34)
<a id="feature-35"></a> [Feature #35](features/feature-35.md#feature-35)
<a id="feature-36"></a> [Feature #36](features/feature-36.md#feature-36)
<a id="feature-37"></a> [Feature #37](features/feature-37.md#feature-37)
<a id="feature-38"></a> [Feature #38](features/feature-38.md#feature-38)
<a id="feature-39"></a> [Feature #39](features/feature-39.md#feature-39)
<a id="feature-40"></a> [Feature #40](features/feature-40.md#feature-40)
<a id="feature-41"></a> [Feature #41](features/feature-41.md#feature-41)
<a id="feature-42"></a> [Feature #42](features/feature-42.md#feature-42)
<a id="feature-43"></a> [Feature #43](features/feature-43.md#feature-43)
<a id="feature-44"></a> [Feature #44](features/feature-44.md#feature-44)
<a id="blueprint-feature-4"></a> [Blueprint #4](features/feature-04.md#blueprint-feature-4)
<a id="blueprint-feature-5"></a> [Blueprint #5](features/feature-05.md#blueprint-feature-5)
<a id="blueprint-feature-7"></a> [Blueprint #7](features/feature-07.md#blueprint-feature-7)
<a id="blueprint-feature-8"></a> [Blueprint #8](features/feature-08.md#blueprint-feature-8)
<a id="blueprint-feature-10"></a> [Blueprint #10](features/feature-10.md#blueprint-feature-10)
<a id="blueprint-feature-11"></a> [Blueprint #11](features/feature-11.md#blueprint-feature-11)
<a id="blueprint-feature-12"></a> [Blueprint #12](features/feature-12.md#blueprint-feature-12)
<a id="blueprint-feature-13"></a> [Blueprint #13](features/feature-13.md#blueprint-feature-13)
<a id="blueprint-feature-14"></a> [Blueprint #14](features/feature-14.md#blueprint-feature-14)
<a id="blueprint-feature-15"></a> [Blueprint #15](features/feature-15.md#blueprint-feature-15)
<a id="blueprint-feature-16"></a> [Blueprint #16](features/feature-16.md#blueprint-feature-16)
<a id="blueprint-feature-17"></a> [Blueprint #17](features/feature-17.md#blueprint-feature-17)
<a id="blueprint-feature-18"></a> [Blueprint #18](features/feature-18.md#blueprint-feature-18)
<a id="blueprint-feature-19"></a> [Blueprint #19](features/feature-19.md#blueprint-feature-19)
<a id="blueprint-feature-20"></a> [Blueprint #20](features/feature-20.md#blueprint-feature-20)
<a id="blueprint-feature-21"></a> [Blueprint #21](features/feature-21.md#blueprint-feature-21)
<a id="blueprint-feature-22"></a> [Blueprint #22](features/feature-22.md#blueprint-feature-22)
<a id="blueprint-feature-23"></a> [Blueprint #23](features/feature-23.md#blueprint-feature-23)
<a id="blueprint-feature-24"></a> [Blueprint #24](features/feature-24.md#blueprint-feature-24)
<a id="blueprint-feature-25"></a> [Blueprint #25](features/feature-25.md#blueprint-feature-25)
<a id="blueprint-feature-26"></a> [Blueprint #26](features/feature-26.md#blueprint-feature-26)
<a id="blueprint-feature-27"></a> [Blueprint #27](features/feature-27.md#blueprint-feature-27)
<a id="blueprint-feature-28"></a> [Blueprint #28](features/feature-28.md#blueprint-feature-28)
<a id="blueprint-feature-29"></a> [Blueprint #29](features/feature-29.md#blueprint-feature-29)
<a id="blueprint-feature-30"></a> [Blueprint #30](features/feature-30.md#blueprint-feature-30)
<a id="blueprint-feature-31"></a> [Blueprint #31](features/feature-31.md#blueprint-feature-31)
<a id="blueprint-feature-32"></a> [Blueprint #32](features/feature-32.md#blueprint-feature-32)
<a id="blueprint-feature-33"></a> [Blueprint #33](features/feature-33.md#blueprint-feature-33)
<a id="blueprint-feature-34"></a> [Blueprint #34](features/feature-34.md#blueprint-feature-34)
<a id="blueprint-feature-35"></a> [Blueprint #35](features/feature-35.md#blueprint-feature-35)
<a id="blueprint-feature-36"></a> [Blueprint #36](features/feature-36.md#blueprint-feature-36)
<a id="blueprint-feature-37"></a> [Blueprint #37](features/feature-37.md#blueprint-feature-37)
<a id="blueprint-feature-38"></a> [Blueprint #38](features/feature-38.md#blueprint-feature-38)
<a id="blueprint-feature-39"></a> [Blueprint #39](features/feature-39.md#blueprint-feature-39)
<a id="blueprint-feature-40"></a> [Blueprint #40](features/feature-40.md#blueprint-feature-40)
<a id="blueprint-feature-41"></a> [Blueprint #41](features/feature-41.md#blueprint-feature-41)
<a id="blueprint-feature-42"></a> [Blueprint #42](features/feature-42.md#blueprint-feature-42)
<a id="blueprint-feature-43"></a> [Blueprint #43](features/feature-43.md#blueprint-feature-43)
<a id="blueprint-feature-44"></a> [Blueprint #44](features/feature-44.md#blueprint-feature-44)

> **Maintenance:** Update the matrix status here, the detailed contract in the matching feature file, and the applicable monthly history entry after significant work.
