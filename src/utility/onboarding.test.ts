import assert from "node:assert/strict";
import test from "node:test";

import type { HabitId } from "../types/app.ts";

// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { ONBOARDING_STARTER_REWARD, createOnboardingImportId, isOnboardingImportId, resolveOnboardingHabitIds, toggleOnboardingHabitSelection } from "./onboarding.ts";

const currentHabits = ["exercise", "reading", "journaling", "water", "sleep", "outdoors"] as const;
const exactSelectionCases: Array<{ label: string; selectedHabitIds: HabitId[] }> = [
  {
    label: "two",
    selectedHabitIds: ["reading", "water"]
  },
  {
    label: "four",
    selectedHabitIds: ["exercise", "journaling", "sleep", "outdoors"]
  },
  {
    label: "all six",
    selectedHabitIds: [...currentHabits]
  }
];

test("onboarding selection has no six-habit ceiling", () => {
  const selected = currentHabits.reduce(
    (ids, habitId) => toggleOnboardingHabitSelection(ids, habitId),
    [] as typeof currentHabits[number][]
  );

  assert.deepEqual(selected, [...currentHabits]);
  assert.equal(resolveOnboardingHabitIds(currentHabits, selected, false).length, 6);
});

test("skip for now enables every catalog habit, including future entries", () => {
  const futureCatalog = [...currentHabits, "future-habit" as unknown as HabitId];
  assert.deepEqual(resolveOnboardingHabitIds(futureCatalog, [], true), futureCatalog);
});

test("deselecting a habit removes only that habit", () => {
  assert.deepEqual(
    toggleOnboardingHabitSelection(["exercise", "reading"], "exercise"),
    ["reading"]
  );
});

for (const { label, selectedHabitIds } of exactSelectionCases) {
  test(`a completed onboarding payload preserves exactly ${label} selected habits`, () => {
    assert.deepEqual(
      resolveOnboardingHabitIds(currentHabits, selectedHabitIds, false),
      selectedHabitIds
    );
  });
}

test("the introductory reward is fixed and bounded", () => {
  assert.deepEqual(ONBOARDING_STARTER_REWARD, { coins: 10, xp: 10, streakShields: 1 });
});

test("onboarding import IDs are UUIDs accepted by the server RPC", () => {
  const importId = createOnboardingImportId();

  assert.equal(isOnboardingImportId(importId), true);
  assert.equal(isOnboardingImportId("onboarding-legacy-id"), false);
});
