import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { calculateStreakShieldOutcome } from "./streakShield.ts";

const today = "2026-07-28" as const;

test("same-day completion does not consume or reset", () => {
  assert.deepEqual(calculateStreakShieldOutcome({ availableShields: 1, currentDateKey: today, dailyStreak: 4, lastDailyDateKey: today, habitStreak: 7, lastHabitDateKey: today }), { habitStreak: 7, dailyStreak: 4, shieldConsumed: false });
});

test("consecutive one-day gap increments without consuming", () => {
  assert.deepEqual(calculateStreakShieldOutcome({ availableShields: 1, currentDateKey: today, dailyStreak: 4, lastDailyDateKey: "2026-07-27", habitStreak: 7, lastHabitDateKey: "2026-07-27" }), { habitStreak: 8, dailyStreak: 5, shieldConsumed: false });
});

test("date-key boundaries remain consecutive across a month", () => {
  assert.deepEqual(calculateStreakShieldOutcome({ availableShields: 1, currentDateKey: "2026-08-01", dailyStreak: 4, lastDailyDateKey: "2026-07-31", habitStreak: 7, lastHabitDateKey: "2026-07-31" }), { habitStreak: 8, dailyStreak: 5, shieldConsumed: false });
});

test("a multi-day gap with no shield resets to one", () => {
  assert.deepEqual(calculateStreakShieldOutcome({ availableShields: 0, currentDateKey: today, dailyStreak: 4, lastDailyDateKey: "2026-07-24", habitStreak: 7, lastHabitDateKey: "2026-07-24" }), { habitStreak: 1, dailyStreak: 1, shieldConsumed: false });
});

test("one shield protects both affected streaks and increments stored values", () => {
  assert.deepEqual(calculateStreakShieldOutcome({ availableShields: 1, currentDateKey: today, dailyStreak: 4, lastDailyDateKey: "2026-07-24", habitStreak: 7, lastHabitDateKey: "2026-07-24" }), { habitStreak: 8, dailyStreak: 5, shieldConsumed: true });
});

test("a shield protects only the habit streak when only it is at risk", () => {
  assert.deepEqual(calculateStreakShieldOutcome({ availableShields: 1, currentDateKey: today, dailyStreak: 0, lastDailyDateKey: null, habitStreak: 7, lastHabitDateKey: "2026-07-24" }), { habitStreak: 8, dailyStreak: 1, shieldConsumed: true });
});

test("a shield protects only the daily streak when only it is at risk", () => {
  assert.deepEqual(calculateStreakShieldOutcome({ availableShields: 1, currentDateKey: today, dailyStreak: 4, lastDailyDateKey: "2026-07-24", habitStreak: 0, lastHabitDateKey: null }), { habitStreak: 1, dailyStreak: 5, shieldConsumed: true });
});

test("null previous dates do not consume a shield", () => {
  assert.deepEqual(calculateStreakShieldOutcome({ availableShields: 1, currentDateKey: today, dailyStreak: 4, lastDailyDateKey: null, habitStreak: 7, lastHabitDateKey: null }), { habitStreak: 1, dailyStreak: 1, shieldConsumed: false });
});
