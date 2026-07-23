import { guildMainQuestCatalog, guildQuestCatalog, guildQuestsById, guildSideQuestCatalog } from "../constants/guildQuests";
import { createEquipmentLootPreview, type EquipmentLootPreview } from "./equipmentLoot";
import type {
  AppState,
  DateKey,
  GuildQuestDefinition,
  GuildQuestKind,
  GuildQuestPeriodState,
  GuildQuestBoardState,
  GuildQuestRewardPreview,
  HabitId
} from "../types/app";

const DAY_MS = 86_400_000;

export type GuildQuestPeriod = {
  kind: GuildQuestKind;
  key: DateKey;
  startDateKey: DateKey;
  expiresOnDateKey: DateKey;
  daysRemaining: number;
  expiryLabel: string;
};

export type GuildQuestTimeRemaining = {
  daysRemaining: number;
  hoursRemaining: number;
  label: string;
  urgent: boolean;
};

export type GuildQuestProgress = {
  current: number;
  target: number;
  secondaryCurrent?: number;
  secondaryTarget?: number;
  percent: number;
  completed: boolean;
};

export type GuildQuestView = {
  definition: GuildQuestDefinition;
  period: GuildQuestPeriod;
  progress: GuildQuestProgress;
  rewardPreview: EquipmentLootPreview;
  isLocked: boolean;
  isClaimed: boolean;
};

function toUtcDate(dateKey: DateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shiftDateKey(dateKey: DateKey, days: number) {
  const date = toUtcDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

function daysBetween(startDateKey: DateKey, endDateKey: DateKey) {
  return Math.max(0, Math.round((toUtcDate(endDateKey).getTime() - toUtcDate(startDateKey).getTime()) / DAY_MS));
}

function formatExpiryLabel(dateKey: DateKey) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(toUtcDate(dateKey));
}

function getStartOfDateInTimeZone(dateKey: DateKey, timeZone: string) {
  const dateAtUtcMidnight = toUtcDate(dateKey);
  let guess = dateAtUtcMidnight;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(guess);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const representedUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second)
    );
    guess = new Date(dateAtUtcMidnight.getTime() - (representedUtc - guess.getTime()));
  }

  return guess;
}

export function getGuildQuestTimeRemaining(
  period: GuildQuestPeriod,
  timeZone: string,
  now = new Date()
): GuildQuestTimeRemaining {
  const millisecondsRemaining = Math.max(
    0,
    getStartOfDateInTimeZone(period.expiresOnDateKey, timeZone).getTime() - now.getTime()
  );
  const hoursRemaining = Math.ceil(millisecondsRemaining / (60 * 60 * 1000));
  const daysRemaining = Math.ceil(hoursRemaining / 24);
  const urgent = period.kind === "side" ? daysRemaining <= 3 : daysRemaining <= 7;
  const isUnderOneDay = millisecondsRemaining < DAY_MS;

  return {
    daysRemaining,
    hoursRemaining,
    label: isUnderOneDay ? `${hoursRemaining}h left` : `${daysRemaining}d left`,
    urgent
  };
}

function hashValue(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getCandidates(kind: GuildQuestKind, periodKey: DateKey) {
  const catalog = kind === "side" ? guildSideQuestCatalog : guildMainQuestCatalog;
  const count = kind === "side" ? 5 : 3;
  return [...catalog]
    .sort((first, second) => hashValue(`${periodKey}:${first.id}`) - hashValue(`${periodKey}:${second.id}`))
    .slice(0, count)
    .map((quest) => quest.id);
}

export function getGuildQuestPeriod(kind: GuildQuestKind, dateKey: DateKey): GuildQuestPeriod {
  const date = toUtcDate(dateKey);
  const startDateKey =
    kind === "side"
      ? shiftDateKey(dateKey, -date.getUTCDay())
      : `${dateKey.slice(0, 7)}-01`;
  const expiresOnDateKey =
    kind === "side"
      ? shiftDateKey(startDateKey, 7)
      : shiftDateKey(
          startDateKey,
          new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
        );

  return {
    kind,
    key: startDateKey,
    startDateKey,
    expiresOnDateKey,
    daysRemaining: daysBetween(dateKey, expiresOnDateKey),
    expiryLabel: formatExpiryLabel(shiftDateKey(expiresOnDateKey, -1))
  };
}

function createPeriodState(kind: GuildQuestKind, dateKey: DateKey): GuildQuestPeriodState {
  const period = getGuildQuestPeriod(kind, dateKey);
  return {
    periodKey: period.key,
    candidateIds: getCandidates(kind, period.key),
    lockedIds: [],
    claimedIds: []
  };
}

export function createGuildQuestBoard(dateKey: DateKey): GuildQuestBoardState {
  return {
    side: createPeriodState("side", dateKey),
    main: createPeriodState("main", dateKey)
  };
}

export function refreshGuildQuestBoard(board: GuildQuestBoardState, dateKey: DateKey) {
  const sidePeriod = getGuildQuestPeriod("side", dateKey);
  const mainPeriod = getGuildQuestPeriod("main", dateKey);
  return {
    side: board.side.periodKey === sidePeriod.key ? board.side : createPeriodState("side", dateKey),
    main: board.main.periodKey === mainPeriod.key ? board.main : createPeriodState("main", dateKey)
  };
}

export function getGuildQuestDefinition(questId: string) {
  return guildQuestsById[questId];
}

function getCompletions(state: AppState, period: GuildQuestPeriod) {
  return (Object.keys(state.habits) as HabitId[]).flatMap((habitId) =>
    state.habits[habitId].completions
      .filter(
        (completion) =>
          completion.completedOn >= period.startDateKey && completion.completedOn < period.expiresOnDateKey
      )
      .map((completion) => ({ habitId, completion }))
  );
}

function longestConsecutiveRun(dateKeys: DateKey[]) {
  const dates = [...new Set(dateKeys)].sort();
  let longest = 0;
  let current = 0;
  let previous: DateKey | null = null;

  for (const dateKey of dates) {
    current = previous && shiftDateKey(previous, 1) === dateKey ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = dateKey;
  }

  return longest;
}

function getMetricValue(
  definition: GuildQuestDefinition,
  state: AppState,
  period: GuildQuestPeriod
): Pick<GuildQuestProgress, "current" | "secondaryCurrent"> {
  const completions = getCompletions(state, period);
  const byDate = new Map<DateKey, Set<HabitId>>();
  for (const { habitId, completion } of completions) {
    const habitsForDate = byDate.get(completion.completedOn) ?? new Set<HabitId>();
    habitsForDate.add(habitId);
    byDate.set(completion.completedOn, habitsForDate);
  }

  switch (definition.metric) {
    case "same-habit-days":
      return {
        current: Math.max(
          0,
          ...(Object.keys(state.habits) as HabitId[]).map(
            (habitId) => new Set(completions.filter((item) => item.habitId === habitId).map((item) => item.completion.completedOn)).size
          )
        )
      };
    case "unique-habits":
      return { current: new Set(completions.map((item) => item.habitId)).size };
    case "multi-habit-days":
      return { current: [...byDate.values()].filter((habits) => habits.size >= 2).length };
    case "daily-completions":
      return { current: completions.length };
    case "timed-and-one-time": {
      let timed = 0;
      let oneTime = 0;
      for (const { habitId, completion } of completions) {
        const node = state.habits[habitId].sections
          .find((section) => section.id === completion.sectionId)
          ?.nodes.find((candidate) => candidate.id === completion.nodeId);
        if (node?.questType === "timed") timed += 1;
        if (node?.questType === "one-time") oneTime += 1;
      }
      return { current: timed, secondaryCurrent: oneTime };
    }
    case "distinct-completion-days":
      return { current: byDate.size };
    case "two-habits-two-days": {
      const qualifyingHabits = (Object.keys(state.habits) as HabitId[]).filter(
        (habitId) => new Set(completions.filter((item) => item.habitId === habitId).map((item) => item.completion.completedOn)).size >= 2
      );
      return { current: qualifyingHabits.length };
    }
    case "chapter-nodes": {
      const chapterCounts = new Map<string, number>();
      for (const { completion } of completions) {
        chapterCounts.set(completion.sectionId, (chapterCounts.get(completion.sectionId) ?? 0) + 1);
      }
      return { current: Math.max(0, ...chapterCounts.values()) };
    }
    case "chapter-reward-claimed":
      return {
        current: state.activityLog.filter(
          (activity) =>
            activity.type === "chapter-reward" &&
            activity.occurredAt.slice(0, 10) >= period.startDateKey &&
            activity.occurredAt.slice(0, 10) < period.expiresOnDateKey
        ).length
      };
    case "habit-completions-each":
      return {
        current: Math.min(
          ...(Object.keys(state.habits) as HabitId[]).map(
            (habitId) => completions.filter((item) => item.habitId === habitId).length
          )
        )
      };
    case "max-habit-streak":
      return {
        current: Math.max(
          0,
          ...(Object.keys(state.habits) as HabitId[]).map((habitId) =>
            longestConsecutiveRun(
              completions
                .filter((item) => item.habitId === habitId)
                .map((item) => item.completion.completedOn)
            )
          )
        )
      };
  }
}

export function getGuildQuestProgress(
  definition: GuildQuestDefinition,
  state: AppState,
  period: GuildQuestPeriod
): GuildQuestProgress {
  const values = getMetricValue(definition, state, period);
  const current = Math.max(0, values.current);
  const target = definition.target;
  const secondaryTarget = definition.secondaryTarget;
  const secondaryCurrent = values.secondaryCurrent;
  const primaryPercent = target > 0 ? Math.min(1, current / target) : 0;
  const secondaryPercent =
    secondaryTarget && typeof secondaryCurrent === "number"
      ? Math.min(1, secondaryCurrent / secondaryTarget)
      : 1;

  return {
    current,
    target,
    secondaryCurrent,
    secondaryTarget,
    percent: Math.min(primaryPercent, secondaryPercent),
    completed: primaryPercent >= 1 && secondaryPercent >= 1
  };
}

export function getGuildQuestView(
  definition: GuildQuestDefinition,
  state: AppState,
  dateKey: DateKey,
  periodState: GuildQuestPeriodState
): GuildQuestView {
  const period = getGuildQuestPeriod(definition.kind, dateKey);
  const isLocked = periodState.lockedIds.includes(definition.id);
  return {
    definition,
    period,
    progress: isLocked
      ? getGuildQuestProgress(definition, state, period)
      : { current: 0, target: definition.target, secondaryTarget: definition.secondaryTarget, percent: 0, completed: false },
    rewardPreview: createEquipmentLootPreview(
      `${period.key}:${definition.id}`,
      definition.reward.itemRarityFloor,
      periodState.rewardPreviews?.[definition.id]
    ),
    isLocked,
    isClaimed: periodState.claimedIds.includes(definition.id)
  };
}

export function getGuildQuestViews(
  state: AppState,
  dateKey: DateKey,
  kind: GuildQuestKind
) {
  const board = refreshGuildQuestBoard(state.guildQuestBoard, dateKey);
  const periodState = board[kind];
  const lockedIds = new Set(periodState.lockedIds);
  const orderedIds = [
    ...periodState.lockedIds,
    ...periodState.candidateIds.filter((questId) => !lockedIds.has(questId))
  ];

  return orderedIds
    .map((questId) => getGuildQuestDefinition(questId))
    .filter((definition): definition is GuildQuestDefinition => Boolean(definition))
    .map((definition) => getGuildQuestView(definition, state, dateKey, periodState));
}

export function getGuildQuestLockedViews(state: AppState, dateKey: DateKey, kind: GuildQuestKind) {
  return getGuildQuestViews(state, dateKey, kind).filter((quest) => quest.isLocked);
}

export function getGuildQuestRewardLabel(definition: GuildQuestDefinition) {
  return `Random ${definition.reward.itemRarityFloor[0].toUpperCase()}${definition.reward.itemRarityFloor.slice(1)}+ Equipment`;
}

export function getGuildQuestRewardPreviewSelection(
  quest: GuildQuestView
): GuildQuestRewardPreview {
  return {
    itemDefinitionId: quest.rewardPreview.definition.id,
    rarity: quest.rewardPreview.rarity
  };
}

export { guildQuestCatalog };
