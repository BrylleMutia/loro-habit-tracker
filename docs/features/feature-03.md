# Feature #3 - Habit Quick-Switcher (P0)

> Roadmap index: [PLANS.md](../PLANS.md#feature-3)

### <a id="feature-3"></a>3. Habit Quick-Switcher (P0)

**What:** A horizontal scrollable row of habit icon pills that lets players jump between habits without navigating back to a list.

**Why:** Currently switching habits requires going through `HabitPathScreen` back button. A persistent switcher makes exploration frictionless.

**Implementation notes (as built):**
- ✅ Added reusable `HabitSwitcher` — a horizontal `ScrollView` of `TouchableOpacity` pills rendered below the `HabitPathScreen` header.
- ✅ Each pill retains the habit icon and label, then overlays the same semantic status icons used by Home (`checkmark-circle` for completed today and `play-circle-outline` for a timed quest in progress) at the icon's lower-right corner.
- ✅ The selected habit uses a `bg-primary` highlight and calls `setActiveHabit(habitId)` directly, so the existing path header, chapters, rewards, and node statuses update in place.
- ✅ Selection haptics fire only for a real habit change and respect the user's haptics setting.
- ✅ Home intentionally keeps its existing 2×3 status grid from Feature #1. It gives players a complete at-a-glance daily overview; adding a second switcher there would duplicate the same selection control.
- ✅ **"Resume quest" visibility:** A non-active habit with a timed quest started today shows a gold play badge in the path switcher.

---
