import type { GuildQuestDefinition } from "../types/app";

export const guildSideQuestCatalog: readonly GuildQuestDefinition[] = [
  {
    id: "steady-trail",
    kind: "side",
    title: "Steady Trail",
    description: "Complete the same habit on five different days.",
    icon: "footsteps-outline",
    metric: "same-habit-days",
    target: 5,
    reward: { coins: 45, xp: 40, itemRarityFloor: "rare" }
  },
  {
    id: "four-corners",
    kind: "side",
    title: "Four Corners",
    description: "Complete each of the four habits at least once.",
    icon: "compass-outline",
    metric: "unique-habits",
    target: 4,
    reward: { coins: 50, xp: 45, itemRarityFloor: "rare" }
  },
  {
    id: "double-step",
    kind: "side",
    title: "Double Step",
    description: "Complete two different habits on the same day.",
    icon: "shuffle-outline",
    metric: "multi-habit-days",
    target: 1,
    reward: { coins: 35, xp: 30, itemRarityFloor: "rare" }
  },
  {
    id: "pathfinder",
    kind: "side",
    title: "Pathfinder",
    description: "Complete three Daily Quests this week.",
    icon: "map-outline",
    metric: "daily-completions",
    target: 3,
    reward: { coins: 45, xp: 40, itemRarityFloor: "rare" }
  },
  {
    id: "timed-and-one-time",
    kind: "side",
    title: "Timed & One-Time",
    description: "Complete two timed and two one-time Daily Quests.",
    icon: "timer-outline",
    metric: "timed-and-one-time",
    target: 2,
    secondaryTarget: 2,
    reward: { coins: 60, xp: 55, itemRarityFloor: "rare" }
  },
  {
    id: "daily-rhythm",
    kind: "side",
    title: "Daily Rhythm",
    description: "Complete a Daily Quest on five different days.",
    icon: "calendar-outline",
    metric: "distinct-completion-days",
    target: 5,
    reward: { coins: 40, xp: 35, itemRarityFloor: "rare" }
  },
  {
    id: "twin-trails",
    kind: "side",
    title: "Twin Trails",
    description: "Complete two different habits on at least two days each.",
    icon: "git-compare-outline",
    metric: "two-habits-two-days",
    target: 2,
    reward: { coins: 55, xp: 50, itemRarityFloor: "rare" }
  },
  {
    id: "chapter-touch",
    kind: "side",
    title: "Chapter Touch",
    description: "Advance one chapter by completing three nodes.",
    icon: "flag-outline",
    metric: "chapter-nodes",
    target: 3,
    reward: { coins: 60, xp: 55, itemRarityFloor: "rare" }
  }
] as const;

export const guildMainQuestCatalog: readonly GuildQuestDefinition[] = [
  {
    id: "chapter-hero",
    kind: "main",
    title: "Chapter Hero",
    description: "Claim one chapter reward this month.",
    icon: "trophy-outline",
    metric: "chapter-reward-claimed",
    target: 1,
    reward: { coins: 175, xp: 160, itemRarityFloor: "epic" }
  },
  {
    id: "habit-constellation",
    kind: "main",
    title: "Habit Constellation",
    description: "Complete each habit three times this month.",
    icon: "sparkles-outline",
    metric: "habit-completions-each",
    target: 3,
    reward: { coins: 200, xp: 180, itemRarityFloor: "epic" }
  },
  {
    id: "long-trail",
    kind: "main",
    title: "Long Trail",
    description: "Complete Daily Quests on twenty different days.",
    icon: "trail-sign-outline",
    metric: "distinct-completion-days",
    target: 20,
    reward: { coins: 220, xp: 200, itemRarityFloor: "epic" }
  },
  {
    id: "streak-keeper",
    kind: "main",
    title: "Streak Keeper",
    description: "Reach a ten-day streak with any habit.",
    icon: "flame-outline",
    metric: "max-habit-streak",
    target: 10,
    reward: { coins: 190, xp: 170, itemRarityFloor: "epic" }
  },
  {
    id: "relic-collector",
    kind: "main",
    title: "Relic Collector",
    description: "Complete twelve Daily Quests this month.",
    icon: "albums-outline",
    metric: "daily-completions",
    target: 12,
    reward: { coins: 210, xp: 190, itemRarityFloor: "epic" }
  }
] as const;

export const guildQuestCatalog = [
  ...guildSideQuestCatalog,
  ...guildMainQuestCatalog
] as const;

export const guildQuestsById = Object.fromEntries(
  guildQuestCatalog.map((quest) => [quest.id, quest])
) as Record<string, GuildQuestDefinition>;
