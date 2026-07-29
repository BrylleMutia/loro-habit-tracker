import type { AdventureNode, HabitId } from "../types/app";

/** Minimum values shared by the More selectors, Home display, and local validation. */
export const habitTargetMinimums: Readonly<Record<HabitId, number>> = {
  exercise: 5,
  reading: 5,
  journaling: 5,
  water: 1,
  sleep: 1,
  outdoors: 1
};

export function getEffectiveHabitTarget(
  habitId: HabitId,
  node: AdventureNode,
  override: number | undefined
) {
  const nodeTarget =
    node.questType === "timed"
      ? node.targetDurationSeconds / 60
      : node.targetQuantity;

  if (override === undefined || !Number.isFinite(override)) {
    return nodeTarget;
  }

  return Math.max(habitTargetMinimums[habitId], Math.round(override));
}

export function getDailyQuestSummary(
  habitId: HabitId,
  title: string,
  target: number
) {
  switch (habitId) {
    case "exercise":
      return `Complete a ${target}-minute ${title.toLowerCase()} movement session.`;
    case "reading":
      return `Read with focus for ${target} minutes.`;
    case "journaling":
      return `Journal with focus for ${target} minutes.`;
    case "water":
      return `Drink ${target} glasses of water across your day.`;
    case "sleep":
      return `Complete your wind-down routine and aim for ${target} hours of sleep.`;
    case "outdoors":
      return `Spend ${target} minutes outdoors today.`;
  }
}
