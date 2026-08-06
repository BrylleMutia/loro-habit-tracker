# Feature #26 - Badge Indicators on Tab Bar (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-26)

### <a id="feature-26"></a>26. Badge Indicators on Tab Bar (P3)

**What:** Red badge dots on tab bar icons for pending actions.

**Why:** User-requested. Standard mobile pattern for drawing attention.

**Badge rules:**
- **Home:** Unfinished habits count (e.g., "3" if 3 of 6 not done)
- **Profile:** New unlocked badges or completed sets
- **Shop:** New items available (if rotating stock is added)
- **Guild:** Claimable rewards

**Implementation notes:**
- Add `badgeCount` or `hasBadge` to each tab in `PersistentTabHost`
- Red dot (not number) for Profile/Shop, number for Home
- Derived from state in `AppNavigator` or tab host

---

## Delivery Blueprint — Phase 3 — Long-Term Engagement and Compassionate Retention

### <a id="blueprint-feature-26"></a>Feature #26 — Bottom-Tab Badges

**Rules**

- Centralize badge derivation in one selector returning `Record<TabId, TabBadge | null>`.
- Prefer actionable positives: claimable Guild rewards, unseen Stash items, new Profile achievements, or a Shop/catalog update. Avoid making Home's unfinished-habit count feel like a red failure counter; use a neutral count or omit it.
- Use `9+` for large numeric values and a dot for binary attention.
- The active tab may suppress its own badge while the relevant content is visible, but clearing durable “seen” state follows the owning feature's rules.

**UI and verification**

- Extend the reusable tab item model and `BottomTabs` rendering without changing navigation semantics or haptic behavior.
- Add accessibility labels such as “Guild, 1 reward ready,” ensure badges do not intercept touches, and keep them inside safe icon bounds.
- Test zero/one/many, active tab, unseen item lifecycle, offline cached state, large text, small screens, and rapid tab transitions.
