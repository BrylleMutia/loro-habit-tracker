import type { AppState, DateKey, HabitId } from "../types/app";
import type {
  LoryBriefingContext,
  LoryBriefingHabit,
  LoryBriefingPendingAction
} from "../types/loryBriefing";
import { getAdventureSnapshot, getDateKeyDifference, getEffectiveStreak, getSectionCompletedCount } from "./adventurePath";
import { getGuildQuestViews } from "./guildQuests";

const RECENT_DAYS = 7;
const MAX_PENDING_ACTIONS = 6;

function getDateKeyInTimeZone(instant: string, timeZone: string): DateKey {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date(instant));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return instant.slice(0, 10);
  }
}

function isRecentDate(dateKey: DateKey, todayDateKey: DateKey) {
  const difference = getDateKeyDifference(dateKey, todayDateKey);
  return difference >= 0 && difference < RECENT_DAYS;
}

function getChapterProgress(state: AppState, habitId: HabitId, todayDateKey: DateKey) {
  const habit = state.habits[habitId];
  const adventure = getAdventureSnapshot(habit, todayDateKey);
  const focus = adventure.focusLocation;

  if (!focus) return "complete";

  return `${getSectionCompletedCount(habit, focus.section.id)}/${focus.section.nodes.length}`;
}

function getHabitBriefing(
  state: AppState,
  habitId: HabitId,
  todayDateKey: DateKey
): LoryBriefingHabit {
  const habit = state.habits[habitId];
  const adventure = getAdventureSnapshot(habit, todayDateKey);
  const recentCompletionCount = habit.completions.filter((completion) =>
    isRecentDate(completion.completedOn, todayDateKey)
  ).length;
  const focus = adventure.focusLocation;

  return {
    name: habit.label,
    streak: getEffectiveStreak(habit.streak, habit.lastCompletedDateKey, todayDateKey),
    today: adventure.pathComplete
      ? "path_complete"
      : adventure.completedToday
        ? "complete"
        : adventure.timedQuestProgress
          ? "in_progress"
          : "pending",
    ...(focus ? { questType: focus.node.questType } : {}),
    chapterProgress: getChapterProgress(state, habitId, todayDateKey),
    completedLast7Days: recentCompletionCount
  };
}

function addPendingAction(
  actions: LoryBriefingPendingAction[],
  action: LoryBriefingPendingAction
) {
  if (actions.length < MAX_PENDING_ACTIONS) actions.push(action);
}

function getPendingActions(state: AppState, todayDateKey: DateKey) {
  const actions: LoryBriefingPendingAction[] = [];

  if (state.dailyCheckIn.lastClaimedDateKey !== todayDateKey) {
    addPendingAction(actions, { type: "daily_check_in" });
  }

  for (const habitId of Object.keys(state.habits) as HabitId[]) {
    const habit = state.habits[habitId];
    const adventure = getAdventureSnapshot(habit, todayDateKey);
    const focus = adventure.focusLocation;

    if (!focus || adventure.completedToday) continue;

    addPendingAction(actions, {
      type: adventure.timedQuestProgress ? "complete_quest" : "start_quest",
      habit: habit.label,
      questType: focus.node.questType,
      title: focus.node.title
    });

    const chapterCompleted =
      getSectionCompletedCount(habit, focus.section.id) === focus.section.nodes.length;
    if (chapterCompleted && !habit.claimedChapterRewardIds.includes(focus.section.id)) {
      addPendingAction(actions, {
        type: "claim_chapter_reward",
        habit: habit.label
      });
    }
  }

  const guildViews = [
    ...getGuildQuestViews(state, todayDateKey, "side"),
    ...getGuildQuestViews(state, todayDateKey, "main")
  ];
  for (const quest of guildViews) {
    if (quest.isLocked && quest.progress.completed && !quest.isClaimed) {
      addPendingAction(actions, { type: "claim_guild_quest" });
      break;
    }
  }

  return actions;
}

export function buildLoryBriefingContext(
  state: AppState,
  todayDateKey: DateKey
): LoryBriefingContext {
  const habitIds = Object.keys(state.habits) as HabitId[];
  const habits = habitIds.map((habitId) => getHabitBriefing(state, habitId, todayDateKey));
  const recentCompletions = habitIds.flatMap((habitId) =>
    state.habits[habitId].completions.filter((completion) =>
      isRecentDate(completion.completedOn, todayDateKey)
    )
  );
  const completedByHabit = new Map(
    habitIds.map((habitId) => [
      habitId,
      state.habits[habitId].completions.filter((completion) =>
        isRecentDate(completion.completedOn, todayDateKey)
      ).length
    ])
  );
  const strongestHabitId = [...habitIds].sort(
    (first, second) =>
      (completedByHabit.get(second) ?? 0) - (completedByHabit.get(first) ?? 0) ||
      state.habits[second].streak - state.habits[first].streak
  )[0];
  const attentionHabitId = [...habitIds]
    .filter((habitId) => state.habits[habitId].lastCompletedDateKey !== todayDateKey)
    .sort((first, second) => (completedByHabit.get(first) ?? 0) - (completedByHabit.get(second) ?? 0))[0];
  const activeDays = new Set(recentCompletions.map((completion) => completion.completedOn));
  const activityInWindow = state.activityLog.filter((activity) =>
    isRecentDate(getDateKeyInTimeZone(activity.occurredAt, state.settings.timeZone), todayDateKey)
  );
  const guildViews = [
    ...getGuildQuestViews(state, todayDateKey, "side"),
    ...getGuildQuestViews(state, todayDateKey, "main")
  ];
  const activeGuildViews = guildViews.filter((quest) => quest.isLocked && !quest.isClaimed);
  const readyGuildViews = activeGuildViews.filter((quest) => quest.progress.completed);

  return {
    version: 1,
    date: todayDateKey,
    timeZone: state.settings.timeZone,
    player: {
      name: state.profile.name,
      level: state.profile.level,
      xpPercent: Math.round(
        Math.min(1, Math.max(0, state.profile.xp / state.profile.xpToNextLevel)) * 100
      ),
      dailyStreak: getEffectiveStreak(state.dailyStreak, state.lastStreakDateKey, todayDateKey),
      longestStreak: state.longestStreak,
      coins: state.coins,
      energy: `${state.energy.current}/${state.energy.max}`,
      dailyCheckIn: state.dailyCheckIn.lastClaimedDateKey === todayDateKey ? "claimed" : "pending"
    },
    today: {
      completedHabitCount: habits.filter((habit) => habit.today === "complete").length,
      availableHabitCount: habits.length,
      pendingActions: getPendingActions(state, todayDateKey)
    },
    habits,
    statistics: {
      completedLast7Days: recentCompletions.length,
      activeDaysLast7Days: activeDays.size,
      habitsUsedLast7Days: habitIds.filter((habitId) => (completedByHabit.get(habitId) ?? 0) > 0).length,
      strongestHabit: strongestHabitId ? state.habits[strongestHabitId].label : null,
      attentionHabit: attentionHabitId ? state.habits[attentionHabitId].label : null,
      xpEarnedLast7Days: activityInWindow.reduce((total, activity) => total + activity.xpEarned, 0),
      coinsEarnedLast7Days: activityInWindow.reduce((total, activity) => total + activity.coinsEarned, 0)
    },
    guild: {
      readyToClaim: readyGuildViews.length,
      activeQuests: activeGuildViews.length,
      nearestDeadlineDays:
        activeGuildViews.length > 0
          ? Math.min(...activeGuildViews.map((quest) => quest.period.daysRemaining))
          : null
    }
  };
}
