import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { getDailyQuestSummary, getEffectiveHabitTarget } from "./habitTargets.ts";

const timedNode = {
  id: "exercise-node",
  day: 1,
  title: "Foundation Circuit",
  summary: "Complete a 15-minute foundation circuit movement session.",
  icon: "barbell-outline",
  energyCost: 1,
  reward: { coins: 20, xp: 32 },
  questType: "timed",
  targetDurationSeconds: 900
} as const;

const oneTimeNode = {
  id: "water-node",
  day: 1,
  title: "First Refill",
  summary: "Drink 6 glasses of water across your day.",
  icon: "water-outline",
  energyCost: 0,
  reward: { coins: 14, xp: 23 },
  questType: "one-time",
  targetQuantity: 6,
  targetUnit: "glasses"
} as const;

test("effective timed target comes from the selector override", () => {
  assert.equal(getEffectiveHabitTarget("exercise", timedNode, 30), 30);
  assert.equal(getEffectiveHabitTarget("exercise", timedNode, undefined), 15);
});

test("effective one-time target comes from the selector override", () => {
  assert.equal(getEffectiveHabitTarget("water", oneTimeNode, 8), 8);
  assert.equal(getEffectiveHabitTarget("water", oneTimeNode, undefined), 6);
});

test("quest summary uses the same effective target", () => {
  assert.equal(
    getDailyQuestSummary("exercise", timedNode.title, 30),
    "Complete a 30-minute foundation circuit movement session."
  );
  assert.equal(
    getDailyQuestSummary("water", oneTimeNode.title, 8),
    "Drink 8 glasses of water across your day."
  );
});
