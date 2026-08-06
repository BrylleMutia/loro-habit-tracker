# Feature #20 - Expanded Sound Design (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-20)

### <a id="feature-20"></a>20. Expanded Sound Design (P3)

**What:** Distinct sounds for different loot rarities, streak milestones, and chapter completions.

**Why:** `expo-audio` is already wired for button presses. Expanding the soundscape increases the game-feel dramatically.

**Sound map:**
- Common loot: soft wooden chime
- Uncommon: brighter chime
- Rare: harp arpeggio
- Epic: orchestral sting
- Legendary: full fanfare
- Streak milestone (7, 30, 100): ascending jingle
- Chapter complete: orchestral chord
- Level up: upbeat flourish

**Implementation notes:**
- Add audio files to `src/assets/audio/`
- Register in `src/constants/audio.ts`
- Play via `useAudioPlayer` in `QuestCelebrationModal` and level-up modal
- Respect `settings.soundEnabled`

---

## Delivery Blueprint — Phase 3 — Long-Term Engagement and Compassionate Retention

### <a id="blueprint-feature-20"></a>Feature #20 — Expanded Sound Design

**Audio architecture**

- Centralize reusable sound playback in `AppAudioProvider` with semantic methods such as `playButton`, `playLootRarity`, `playChapterComplete`, and `playLevelUp`.
- Preload/reuse players for low-latency button effects; do not create/release a native shared player on every press.
- Define interruption rules: button sounds may overlap lightly, but only one celebration/fanfare plays at a time. A newer celebration stops or replaces the previous celebration channel.
- Keep calls best-effort. Released-player, interruption, or unsupported-device errors must never reject the game action.
- Respect `soundEnabled` immediately, pause/stop long audio on app background, and restore the audio session conservatively.

**Asset policy**

- Use short trimmed 44.1 kHz/16-bit mono WAV files for latency-critical UI effects when size remains modest.
- Use compressed formats for longer music/fanfares when decode latency is not interaction-critical.
- Normalize loudness across assets, remove leading silence, avoid clipping, document licenses/source prompts, and enforce a total bundle budget.
- Register all assets in `src/constants/audio.ts`; components do not repeat `require()` calls.

**Verification**

- Test rapid presses, simultaneous quest/loot events, mute toggle during playback, app background/foreground, player cleanup, Android/iOS volume behavior, and no regressions to the previously fixed released-player/current-time issues.
