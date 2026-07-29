import type {
  AdventureNode,
  AdventureSection,
  HabitId,
  HabitState,
  IconName
} from "../types/app";
import { getDailyQuestSummary } from "../utility/habitTargets";

type ChapterBlueprint = {
  id: string;
  title: string;
  description: string;
  primaryTarget: number;
  nodeTitles: readonly string[];
};

export const habitOrder: readonly HabitId[] = [
  "exercise",
  "reading",
  "journaling",
  "water",
  "sleep",
  "outdoors"
];

export type HabitCatalogEntry = {
  id: HabitId;
  label: string;
  icon: IconName;
  dailyPrompt: string;
};

export const defaultHabitTargets: Readonly<Record<HabitId, number>> = {
  exercise: 15,
  reading: 10,
  journaling: 5,
  water: 6,
  sleep: 8,
  outdoors: 10
};

const chapterBlueprints: Record<HabitId, readonly ChapterBlueprint[]> = {
  exercise: [
    {
      id: "trailhead-training",
      title: "Trailhead Training",
      description: "Build a safe and repeatable movement routine.",
      primaryTarget: 15,
      nodeTitles: [
        "Foundation Circuit",
        "Mobility Trail",
        "Core Camp",
        "Recovery Walk",
        "Strength Summit",
        "Cardio Crossing",
        "Trailhead Challenge"
      ]
    },
    {
      id: "rising-ridge",
      title: "Rising Ridge",
      description: "Add more challenge while protecting consistency.",
      primaryTarget: 20,
      nodeTitles: [
        "Upper-Body Ascent",
        "Lower-Body Trek",
        "Balance Bridge",
        "Active Recovery",
        "Power Climb",
        "Endurance Route",
        "Ridge Challenge"
      ]
    }
  ],
  reading: [
    {
      id: "pagefinder-path",
      title: "Pagefinder Path",
      description: "Create a comfortable daily reading rhythm.",
      primaryTarget: 10,
      nodeTitles: [
        "Open the Map",
        "Quiet Corner",
        "Ten-Minute Trek",
        "Character Camp",
        "Idea Lookout",
        "Focus Forest",
        "Chapter Challenge"
      ]
    },
    {
      id: "deep-reading-grove",
      title: "Deep Reading Grove",
      description: "Read longer and capture the ideas worth keeping.",
      primaryTarget: 15,
      nodeTitles: [
        "Longer Trail",
        "Theme Tracker",
        "Question Clearing",
        "Distraction Detour",
        "Insight Grove",
        "Memory Marker",
        "Grove Challenge"
      ]
    }
  ],
  journaling: [
    {
      id: "quiet-pages",
      title: "Quiet Pages",
      description: "Build a small daily reflection practice.",
      primaryTarget: 5,
      nodeTitles: [
        "First Entry",
        "Thought Trail",
        "Gratitude Grove",
        "Prompt Path",
        "Clarity Camp",
        "Pattern Pass",
        "Quiet Pages Challenge"
      ]
    },
    {
      id: "storykeeper-ridge",
      title: "Storykeeper Ridge",
      description: "Turn reflection into a steady self-awareness ritual.",
      primaryTarget: 5,
      nodeTitles: [
        "Morning Pages",
        "Mood Marker",
        "Lesson Lookout",
        "Release Route",
        "Intentions Camp",
        "Reflection Ridge",
        "Storykeeper Challenge"
      ]
    }
  ],
  water: [
    {
      id: "hydration-springs",
      title: "Hydration Springs",
      description: "Spread hydration checkpoints across the whole day.",
      primaryTarget: defaultHabitTargets.water,
      nodeTitles: [
        "First Refill",
        "Morning Springs",
        "Steady Stream",
        "Midweek Reservoir",
        "Refill Rhythm",
        "Clear Current",
        "Springs Challenge"
      ]
    },
    {
      id: "river-route",
      title: "River Route",
      description: "Protect the habit during busier daily routines.",
      primaryTarget: defaultHabitTargets.water,
      nodeTitles: [
        "Early Current",
        "Bottle Ready",
        "Meal-Time Refill",
        "Afternoon Crossing",
        "Traveling Stream",
        "Evening Current",
        "River Challenge"
      ]
    }
  ],
  sleep: [
    {
      id: "moonlit-camp",
      title: "Moonlit Camp",
      description: "Build a calm wind-down sequence before bed.",
      primaryTarget: defaultHabitTargets.sleep,
      nodeTitles: [
        "Set Up Camp",
        "Dim the Lanterns",
        "Quiet Trail",
        "Midweek Reset",
        "Gentle Landing",
        "Dream Prep",
        "Moonlit Challenge"
      ]
    },
    {
      id: "dreamer-ridge",
      title: "Dreamer Ridge",
      description: "Strengthen timing and reflect on sleep quality.",
      primaryTarget: defaultHabitTargets.sleep,
      nodeTitles: [
        "Bedtime Marker",
        "Screen-Free Ridge",
        "Quiet Mind",
        "Rest Checkpoint",
        "Tomorrow Prep",
        "Dream Journal",
        "Ridge Challenge"
      ]
    }
  ],
  outdoors: [
    {
      id: "sunlit-trail",
      title: "Sunlit Trail",
      description: "Create a simple daily ritual for time outside.",
      primaryTarget: defaultHabitTargets.outdoors,
      nodeTitles: [
        "Step Outside",
        "Fresh-Air Crossing",
        "Greenway Pause",
        "Sky Checkpoint",
        "Garden Gate",
        "Open-Air Lookout",
        "Sunlit Trail Challenge"
      ]
    },
    {
      id: "wildway-pass",
      title: "Wildway Pass",
      description: "Keep your outdoor rhythm alive through changing days.",
      primaryTarget: defaultHabitTargets.outdoors,
      nodeTitles: [
        "Morning Meadow",
        "Weather Watch",
        "Parkway Trek",
        "Horizon Pause",
        "Trailside Reset",
        "Wildway Lookout",
        "Pass Challenge"
      ]
    }
  ]
};

type DailyQuestDetails = {
  summary: string;
  icon: IconName;
  energyCost: number;
  reward: AdventureNode["reward"];
} & (
  | { questType: "timed"; targetDurationSeconds: number }
  | { questType: "one-time"; targetQuantity: number; targetUnit: string }
);

function getDailyQuestDetails(
  habitId: HabitId,
  title: string,
  primaryTarget: number,
  chapterOrder: number
): DailyQuestDetails {
  switch (habitId) {
    case "exercise":
      return {
        summary: getDailyQuestSummary(habitId, title, primaryTarget),
        icon: "barbell-outline",
        energyCost: 1,
        questType: "timed",
        targetDurationSeconds: primaryTarget * 60,
        reward: { coins: 18 + chapterOrder * 2, xp: 28 + chapterOrder * 4 }
      };
    case "reading":
      return {
        summary: getDailyQuestSummary(habitId, title, primaryTarget),
        icon: "book-outline",
        energyCost: 1,
        questType: "timed",
        targetDurationSeconds: primaryTarget * 60,
        reward: { coins: 16 + chapterOrder * 2, xp: 26 + chapterOrder * 4 }
      };
    case "journaling":
      return {
        summary: getDailyQuestSummary(habitId, title, primaryTarget),
        icon: "create-outline",
        energyCost: 1,
        questType: "timed",
        targetDurationSeconds: primaryTarget * 60,
        reward: { coins: 15 + chapterOrder * 2, xp: 25 + chapterOrder * 4 }
      };
    case "water":
      return {
        summary: getDailyQuestSummary(habitId, title, primaryTarget),
        icon: "water-outline",
        energyCost: 0,
        questType: "one-time",
        targetQuantity: primaryTarget,
        targetUnit: "glasses",
        reward: { coins: 12 + chapterOrder * 2, xp: 20 + chapterOrder * 3 }
      };
    case "sleep":
      return {
        summary: getDailyQuestSummary(habitId, title, primaryTarget),
        icon: "moon-outline",
        energyCost: 0,
        questType: "one-time",
        targetQuantity: primaryTarget,
        targetUnit: "hours",
        reward: { coins: 14 + chapterOrder * 2, xp: 24 + chapterOrder * 3 }
      };
    case "outdoors":
      return {
        summary: getDailyQuestSummary(habitId, title, primaryTarget),
        icon: "leaf-outline",
        energyCost: 0,
        questType: "one-time",
        targetQuantity: primaryTarget,
        targetUnit: "minutes",
        reward: { coins: 13 + chapterOrder * 2, xp: 22 + chapterOrder * 3 }
      };
  }
}

function createAdventureNode(
  habitId: HabitId,
  sectionId: string,
  day: number,
  title: string,
  primaryTarget: number,
  chapterOrder: number
): AdventureNode {
  return {
    id: `${habitId}-${sectionId}-day-${day}`,
    day,
    title,
    ...getDailyQuestDetails(habitId, title, primaryTarget, chapterOrder)
  };
}

function createAdventureSections(habitId: HabitId): AdventureSection[] {
  return chapterBlueprints[habitId].map((blueprint, sectionIndex) => {
    const order = sectionIndex + 1;

    return {
      id: `${habitId}-${blueprint.id}`,
      title: blueprint.title,
      description: blueprint.description,
      order,
      reward: { coins: 75 + sectionIndex * 25, xp: 100 + sectionIndex * 40 },
      nodes: blueprint.nodeTitles.map((title, nodeIndex) =>
        createAdventureNode(
          habitId,
          blueprint.id,
          nodeIndex + 1,
          title,
          blueprint.primaryTarget,
          order
        )
      )
    };
  });
}

function createHabit(
  id: HabitId,
  label: string,
  icon: IconName,
  dailyPrompt: string
): HabitState {
  return {
    id,
    label,
    icon,
    dailyPrompt,
    level: 1,
    xp: 0,
    streak: 0,
    lastCompletedDateKey: null,
    sections: createAdventureSections(id),
    completions: [],
    activeTimedQuest: null,
    claimedChapterRewardIds: []
  };
}

export function createInitialHabits(): Record<HabitId, HabitState> {
  return {
    exercise: createHabit(
      "exercise",
      "Exercise",
      "barbell-outline",
      "Let's move, build strength, and earn today's win!"
    ),
    reading: createHabit(
      "reading",
      "Reading",
      "book-outline",
      "Let's turn a few pages and uncover something new!"
    ),
    journaling: createHabit(
      "journaling",
      "Journaling",
      "create-outline",
      "Take a quiet moment to capture a thought from today's trail."
    ),
    water: createHabit(
      "water",
      "Water",
      "water-outline",
      "Lory says: time to refill and keep your energy flowing!"
    ),
    sleep: createHabit(
      "sleep",
      "Sleep",
      "moon-outline",
      "Let's prepare a calm landing for tomorrow's adventure."
    ),
    outdoors: createHabit(
      "outdoors",
      "Outdoors",
      "leaf-outline",
      "Step outside, breathe deeply, and discover a little more of your world!"
    )
  };
}

export function getHabitCatalog(): HabitCatalogEntry[] {
  const habits = createInitialHabits();
  return habitOrder
    .map((habitId) => habits[habitId])
    .filter((habit): habit is HabitState => Boolean(habit))
    .map(({ id, label, icon, dailyPrompt }) => ({ id, label, icon, dailyPrompt }));
}
