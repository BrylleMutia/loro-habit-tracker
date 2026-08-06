# Feature-Specific: Loot Pool Management

> Decision record extracted from the roadmap. Read this file only when the task touches this topic.

## <a id="loot-pool-management"></a>Feature-Specific: Loot Pool Management

**Problem:** As more equipment sets are added, the loot pool dilutes, making it harder to complete a specific set.

**User's idea:** "Focus set selector — pick 3 target sets"

**Evaluation:** ✅ **Good idea.** This is how many gacha games handle expanding pools without frustrating collectors.

**Implementation:**
- In Profile or Stash, let players "favorite" up to 3 sets
- When loot is rolled, favorited sets get 2× drop weight
- Non-favorited sets still drop but at normal rate
- New players default to Verdant Wayfinder as favorited
- Can be changed anytime (cooldown: once per week to prevent gaming)

### Reviewed Technical Design

- Put the selector in Stash/Catalog, where players can see set progress and understand why they are focusing a set.
- Add `user_focused_equipment_sets(user_id, set_id, selected_at)` with a maximum-three invariant and a separate `focus_sets_changed_at`/next-change rule.
- Change focus through one transactional RPC that validates known active sets, uniqueness, count, and weekly cooldown. Clients cannot write weights directly.
- Apply weights only inside the existing server-private loot grant function; guest loot uses the same weighted selection utility.
- Preserve rarity probabilities first, then weight eligible item definitions by focused set. A focus should improve direction without guaranteeing a specific item or changing advertised rarity.
- Show plain-language impact (“Focused sets are twice as likely within the same rarity”) and avoid casino-style near-miss/odds manipulation.
- Add deterministic eligibility tests and seeded simulation tooling for economy review. Do not depend only on flaky statistical tests in CI.
- Revisit duplicate protection/pity only after measuring real collection completion time; do not layer multiple hidden weighting systems at once.

---
