import type {
  AdventureNode,
  AdventureNodeStatus,
  AdventureReward,
  AdventureSection,
  DateKey,
  HabitState,
  NodeCompletionRecord,
  TimedQuestProgress
} from "../types/app";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export type AdventureNodeLocation = {
  section: AdventureSection;
  node: AdventureNode;
  sectionIndex: number;
  nodeIndex: number;
  flatIndex: number;
};

export type PathPreviewNode = AdventureNodeLocation & {
  status: AdventureNodeStatus;
};

export type AdventureSnapshot = {
  activeLocation: AdventureNodeLocation | null;
  focusLocation: AdventureNodeLocation | null;
  completedTodayLocation: AdventureNodeLocation | null;
  timedQuestProgress: TimedQuestProgress | null;
  chapterProgressPercent: number;
  completedToday: boolean;
  pathComplete: boolean;
  previewNodes: PathPreviewNode[];
};

export function getLocalDateKey(date = new Date()): DateKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDateKeyDifference(from: DateKey, to: DateKey) {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  const fromUtc = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const toUtc = Date.UTC(toYear, toMonth - 1, toDay);

  return Math.round((toUtc - fromUtc) / DAY_IN_MILLISECONDS);
}

export function getNextStreak(current: number, lastDateKey: DateKey | null, today: DateKey) {
  if (lastDateKey === today) {
    return current;
  }

  return lastDateKey && getDateKeyDifference(lastDateKey, today) === 1 ? current + 1 : 1;
}

export function getEffectiveStreak(
  current: number,
  lastDateKey: DateKey | null,
  today: DateKey
) {
  if (!lastDateKey) {
    return 0;
  }

  const difference = getDateKeyDifference(lastDateKey, today);
  return difference >= 0 && difference <= 1 ? current : 0;
}

export function getAdventureNodeLocations(habit: HabitState): AdventureNodeLocation[] {
  let flatIndex = 0;

  return habit.sections.flatMap((section, sectionIndex) =>
    section.nodes.map((node, nodeIndex) => ({
      section,
      node,
      sectionIndex,
      nodeIndex,
      flatIndex: flatIndex++
    }))
  );
}

export function getActiveNodeLocation(habit: HabitState) {
  const completedNodeIds = new Set(habit.completions.map((completion) => completion.nodeId));

  return getAdventureNodeLocations(habit).find(({ node }) => !completedNodeIds.has(node.id)) ?? null;
}

export function getNodeLocation(habit: HabitState, nodeId: string) {
  return getAdventureNodeLocations(habit).find(({ node }) => node.id === nodeId) ?? null;
}

export function getSectionCompletedCount(habit: HabitState, sectionId: string) {
  const section = habit.sections.find((candidate) => candidate.id === sectionId);

  if (!section) {
    return 0;
  }

  const completedNodeIds = new Set(habit.completions.map((completion) => completion.nodeId));
  return section.nodes.filter((node) => completedNodeIds.has(node.id)).length;
}

export function isSectionComplete(habit: HabitState, sectionId: string) {
  const section = habit.sections.find((candidate) => candidate.id === sectionId);

  return Boolean(section && getSectionCompletedCount(habit, sectionId) === section.nodes.length);
}

export function getApplicableTimedQuestProgress(
  habit: HabitState,
  nodeId: string,
  today: DateKey
) {
  const progress = habit.activeTimedQuest;

  return progress?.nodeId === nodeId && progress.startedOn === today ? progress : null;
}

export function getNodeStatus(
  habit: HabitState,
  nodeId: string,
  today: DateKey
): AdventureNodeStatus {
  if (habit.completions.some((completion) => completion.nodeId === nodeId)) {
    return "done";
  }

  const activeLocation = getActiveNodeLocation(habit);
  const hasCompletedToday = habit.lastCompletedDateKey === today;

  return activeLocation?.node.id === nodeId && !hasCompletedToday ? "active" : "locked";
}

function getCompletedTodayLocation(
  habit: HabitState,
  today: DateKey
): AdventureNodeLocation | null {
  const completion = habit.completions.find((candidate) => candidate.completedOn === today);
  return completion ? getNodeLocation(habit, completion.nodeId) : null;
}

function getFocusChapterProgress(habit: HabitState, focus: AdventureNodeLocation | null) {
  if (!focus) {
    return 100;
  }

  const completed = getSectionCompletedCount(habit, focus.section.id);
  return Math.round((completed / focus.section.nodes.length) * 100);
}

function getPathPreview(
  habit: HabitState,
  focus: AdventureNodeLocation | null,
  today: DateKey
) {
  if (!focus) {
    return [];
  }

  const locations = getAdventureNodeLocations(habit);
  const startIndex = Math.max(0, Math.min(focus.flatIndex - 1, locations.length - 3));

  return locations.slice(startIndex, startIndex + 3).map((location) => ({
    ...location,
    status: getNodeStatus(habit, location.node.id, today)
  }));
}

export function getAdventureSnapshot(habit: HabitState, today: DateKey): AdventureSnapshot {
  const activeLocation = getActiveNodeLocation(habit);
  const completedTodayLocation = getCompletedTodayLocation(habit, today);
  const focusLocation = completedTodayLocation ?? activeLocation;

  return {
    activeLocation,
    focusLocation,
    completedTodayLocation,
    timedQuestProgress: activeLocation
      ? getApplicableTimedQuestProgress(habit, activeLocation.node.id, today)
      : null,
    chapterProgressPercent: getFocusChapterProgress(habit, focusLocation),
    completedToday: Boolean(completedTodayLocation),
    pathComplete: activeLocation === null,
    previewNodes: getPathPreview(habit, focusLocation, today)
  };
}

export function createNodeCompletion(
  sectionId: string,
  nodeId: string,
  completedOn: DateKey,
  completedAt: string,
  reward: AdventureReward,
  lootItemId: string | null = null
): NodeCompletionRecord {
  return { sectionId, nodeId, completedOn, completedAt, lootItemId, reward };
}
