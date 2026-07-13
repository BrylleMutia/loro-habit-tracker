import type { HabitId, HabitState } from "../types/app";

const defaultHabits: Record<HabitId, HabitState> = {
  exercise: {
    id: "exercise",
    label: "Exercise",
    icon: "barbell-outline",
    dailyPrompt: "Let's move, build strength, and earn today's win!",
    level: 1,
    xp: 0,
    streak: 0,
    progress: { current: 0, target: 3, unit: "quests" },
    pathItems: [
      {
        id: "exercise-warmup",
        title: "Warm-Up Flow",
        duration: "5 min",
        icon: "body-outline",
        status: "active",
        rewardCoins: 10,
        rewardXp: 15,
        progressAmount: 1
      },
      {
        id: "exercise-workout",
        title: "Workout Quest",
        duration: "15 min",
        icon: "barbell-outline",
        status: "locked",
        rewardCoins: 20,
        rewardXp: 30,
        progressAmount: 1
      },
      {
        id: "exercise-cooldown",
        title: "Stretch & Cooldown",
        duration: "5 min",
        icon: "walk-outline",
        status: "locked",
        rewardCoins: 10,
        rewardXp: 15,
        progressAmount: 1
      },
      {
        id: "exercise-bonus",
        title: "Movement Chest",
        duration: "Complete all 3 quests",
        icon: "gift-outline",
        status: "bonus",
        rewardCoins: 40,
        rewardXp: 50,
        progressAmount: 0
      }
    ]
  },
  reading: {
    id: "reading",
    label: "Reading",
    icon: "book-outline",
    dailyPrompt: "Let's turn a few pages and uncover something new!",
    level: 1,
    xp: 0,
    streak: 0,
    progress: { current: 0, target: 10, unit: "pages" },
    pathItems: [
      {
        id: "reading-book",
        title: "Choose Your Book",
        duration: "1 min",
        icon: "library-outline",
        status: "active",
        rewardCoins: 5,
        rewardXp: 10,
        progressAmount: 0
      },
      {
        id: "reading-pages",
        title: "Read 10 Pages",
        duration: "20 min",
        icon: "book-outline",
        status: "locked",
        rewardCoins: 20,
        rewardXp: 30,
        progressAmount: 10
      },
      {
        id: "reading-reflection",
        title: "One-Line Reflection",
        duration: "2 min",
        icon: "chatbox-ellipses-outline",
        status: "locked",
        rewardCoins: 10,
        rewardXp: 20,
        progressAmount: 0
      },
      {
        id: "reading-bonus",
        title: "Knowledge Chest",
        duration: "Complete today's chapter",
        icon: "gift-outline",
        status: "bonus",
        rewardCoins: 40,
        rewardXp: 50,
        progressAmount: 0
      }
    ]
  },
  water: {
    id: "water",
    label: "Water",
    icon: "water-outline",
    dailyPrompt: "Lory says: time to refill and keep your energy flowing!",
    level: 1,
    xp: 0,
    streak: 0,
    progress: { current: 0, target: 8, unit: "glasses" },
    pathItems: [
      {
        id: "water-morning",
        title: "Morning Glass",
        duration: "1 glass",
        icon: "sunny-outline",
        status: "active",
        rewardCoins: 5,
        rewardXp: 10,
        progressAmount: 1
      },
      {
        id: "water-midday",
        title: "Midday Hydration",
        duration: "3 glasses",
        icon: "water-outline",
        status: "locked",
        rewardCoins: 15,
        rewardXp: 20,
        progressAmount: 3
      },
      {
        id: "water-evening",
        title: "Evening Refill",
        duration: "4 glasses",
        icon: "moon-outline",
        status: "locked",
        rewardCoins: 15,
        rewardXp: 20,
        progressAmount: 4
      },
      {
        id: "water-bonus",
        title: "Hydration Chest",
        duration: "Reach 8 glasses",
        icon: "gift-outline",
        status: "bonus",
        rewardCoins: 35,
        rewardXp: 45,
        progressAmount: 0
      }
    ]
  },
  sleep: {
    id: "sleep",
    label: "Sleep",
    icon: "moon-outline",
    dailyPrompt: "Let's prepare a calm landing for tomorrow's adventure.",
    level: 1,
    xp: 0,
    streak: 0,
    progress: { current: 0, target: 3, unit: "steps" },
    pathItems: [
      {
        id: "sleep-wind-down",
        title: "Start Wind-Down",
        duration: "10 min",
        icon: "bed-outline",
        status: "active",
        rewardCoins: 15,
        rewardXp: 20,
        progressAmount: 1
      },
      {
        id: "sleep-no-screen",
        title: "Screen-Free Break",
        duration: "15 min",
        icon: "phone-portrait-outline",
        status: "locked",
        rewardCoins: 15,
        rewardXp: 20,
        progressAmount: 1
      },
      {
        id: "sleep-log",
        title: "Log Bedtime",
        duration: "1 check-in",
        icon: "checkmark-circle-outline",
        status: "locked",
        rewardCoins: 10,
        rewardXp: 15,
        progressAmount: 1
      },
      {
        id: "sleep-bonus",
        title: "Dream Chest",
        duration: "Complete all 3 steps",
        icon: "gift-outline",
        status: "bonus",
        rewardCoins: 40,
        rewardXp: 50,
        progressAmount: 0
      }
    ]
  }
};

// Each new session receives its own mutable progress and path item objects.
export function createInitialHabits(): Record<HabitId, HabitState> {
  return Object.fromEntries(
    Object.entries(defaultHabits).map(([habitId, habit]) => [
      habitId,
      {
        ...habit,
        progress: { ...habit.progress },
        pathItems: habit.pathItems.map((item) => ({ ...item }))
      }
    ])
  ) as Record<HabitId, HabitState>;
}
