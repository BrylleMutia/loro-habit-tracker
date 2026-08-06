# Feature #1 - Today-at-a-Glance Habit Strip (P0)

> Roadmap index: [PLANS.md](../PLANS.md#feature-1)

### <a id="feature-1"></a>1. Today-at-a-Glance Habit Strip (P0)

**What:** A compact habit grid below the resource bar on Home showing each currently enabled habit from the shared catalog with a check/dot indicator for today's completion status. Tapping a habit switches to it.

**Why:** Currently players must navigate into individual habits to see daily status. This reduces friction and encourages multi-habit days (synergy with guild quests like "Double Step" and "Four Corners").

**Implementation notes (as built):**
- ✅ Implemented directly in the existing `ActiveHabitCard` 2×3 habit grid (no standalone strip component)
- ✅ Home now treats the compact greeting, selected-trail summary, 2×3 grid, and `DailyQuestCard` as the primary choose-then-act sequence. The full Lory briefing and Adventure Map follow the quest so guidance and progression remain available without delaying the daily action.
- All habit pills share a consistent blue background (`bg-primary-soft`, `border-primary`) for visual clarity
- Active pill uses a slightly stronger border (`border-primary-strong`)
- Status is communicated through the icon only:
  - **Completed today:** green checkmark-circle icon + green label
  - **In progress (timed quest running):** gold play-circle-outline icon + gold label
  - **Active/selected (unstarted):** blueDark habit icon + blue label
  - **Default/unstarted:** muted habit icon + muted label
- ✅ `DailyQuestCard` keeps the active habit icon as its primary icon and overlays the matching completion/in-progress status badge at the lower-right.
- Uses `useGameHabits().habitList`, `useGameSync().todayDateKey`, and `useGameActions().setActiveHabit`
- The grid's contents and order follow the enabled-habit preferences edited in More; existing users still start with the full current catalog.
- Future enhancement: add a `3/6 trails cleared` counter summary above the grid with individual habit completion dots
- Future enhancement: show a "Possible loot" rarity teaser (e.g., `?` silhouette matching the node's loot tier) on the `DailyQuestCard` to build anticipation before quest completion

---
