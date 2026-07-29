import type { DateKey } from "../types/app";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function isReset(lastDateKey: DateKey | null, today: DateKey) {
  if (!lastDateKey) return false;
  const last = Date.parse(`${lastDateKey}T00:00:00Z`);
  const current = Date.parse(`${today}T00:00:00Z`);
  return !Number.isFinite(last) || !Number.isFinite(current) ||
    Math.floor((current - last) / DAY_IN_MILLISECONDS) > 1;
}

function nextStreak(current: number, lastDateKey: DateKey | null, today: DateKey) {
  if (!lastDateKey) return 1;
  if (lastDateKey === today) return current;
  const last = Date.parse(`${lastDateKey}T00:00:00Z`);
  const currentDate = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(last) || !Number.isFinite(currentDate)) return 1;
  return Math.floor((currentDate - last) / DAY_IN_MILLISECONDS) === 1 ? current + 1 : 1;
}

export type StreakShieldCalculation = {
  habitStreak: number;
  dailyStreak: number;
  shieldConsumed: boolean;
};

export function calculateStreakShieldOutcome({
  availableShields,
  currentDateKey,
  dailyStreak,
  lastDailyDateKey,
  habitStreak,
  lastHabitDateKey
}: {
  availableShields: number;
  currentDateKey: DateKey;
  dailyStreak: number;
  lastDailyDateKey: DateKey | null;
  habitStreak: number;
  lastHabitDateKey: DateKey | null;
}): StreakShieldCalculation {
  const habitStreakWouldReset =
    habitStreak > 0 && isReset(lastHabitDateKey, currentDateKey);
  const dailyStreakWouldReset =
    dailyStreak > 0 && isReset(lastDailyDateKey, currentDateKey);
  const shieldConsumed =
    availableShields > 0 && (habitStreakWouldReset || dailyStreakWouldReset);

  return {
    habitStreak: shieldConsumed && habitStreakWouldReset
      ? habitStreak + 1
      : nextStreak(habitStreak, lastHabitDateKey, currentDateKey),
    dailyStreak: shieldConsumed && dailyStreakWouldReset
      ? dailyStreak + 1
      : nextStreak(dailyStreak, lastDailyDateKey, currentDateKey),
    shieldConsumed
  };
}
