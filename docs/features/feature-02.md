# Feature #2 - Energy Regeneration Countdown Timer (P0)

> Roadmap index: [PLANS.md](../PLANS.md#feature-2)

### <a id="feature-2"></a>2. Energy Regeneration Countdown Timer (P0)

**What:** Display "⚡ +1 in 23m" next to the energy pill in `ResourceBar` when energy is below max. Also add a gentle zero-energy fallback so players are never blocked from habits.

**Why:** Classic mobile retention mechanic. The state already tracks `lastRefillAt` — just needs a visible countdown. Energy should feel like a pacing mechanic, not a paywall — especially important for a wellness app.

**Implementation notes (as built):**
- ✅ Client: Added a 30-second interval in `ResourceBar` that calculates remaining time until next energy refill and the effective energy including passive regeneration
- ✅ Client: When `lastRefillAt` is available and energy is below max, displays "+1 in Nm" suffix and updates the displayed value to include passively regenerated points
- ✅ Home layout: energy, streak, shields, and coins now share one reference-style segmented capsule at the top-left. The adjacent daily check-in remains a distinct 44×44 action, and the refill suffix stacks inside the energy segment when needed so narrow screens retain the full value and label.
- ✅ Local repo: `lastRefillAt` now set to `now` on energy deduction in `startLocalDailyQuest` and `completeLocalDailyQuest` (was only set during daily check-in)
- ✅ Server: New migration `20260726000100_energy_passive_refill.sql` that:
  - Updates `start_daily_quest` RPC to set `last_energy_refill_at = action_time` when energy is consumed
  - Updates `complete_daily_quest` RPC to set `last_energy_refill_at = action_time` when energy is consumed for one-time quests
  - Updates `build_game_snapshot` to compute passive refill: `energy_current + floor(elapsed_seconds / 1800)` capped at `energy_max`
- ✅ Cross-device: After logout/login or device switch, the server snapshot includes passively regenerated energy based on real elapsed time
- Refill rate: 1 energy per 30 minutes (configurable in `ENERGY_REFILL_INTERVAL_MS` constant)
- **Future: Zero-energy fallback** — when energy is 0 and user tries a timed quest, offer "Start with reduced rewards" (50% coins, 50% XP, no loot drop) instead of blocking
- **Future: Low-energy warning** — when energy ≤ 1, show a warning before starting a timed quest
- One-time habits (Water, Sleep) remain unaffected and always work at zero energy

---
