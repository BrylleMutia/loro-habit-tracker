import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmModal } from "../../components/ConfirmModal";
import { QuestActionButton } from "../../components/QuestActionButton";
import { ResourceBar } from "../../components/ResourceBar";
import { colors } from "../../constants/colors";
import { defaultHabitTargets } from "../../constants/habits";
import { useAuth } from "../../contexts/authContext";
import {
  useGameActions,
  useGameHabits,
  useGameSettings,
  useGameSync
} from "../../contexts/appContext";
import { useHaptics } from "../../hooks/useHaptics";
import { shadows } from "../../styles/shadows";
import type { AppSettings, HabitId } from "../../types/app";
import { habitTargetMinimums } from "../../utility/habitTargets";

type MoreScreenProps = {
  expandHabitTargets?: boolean;
  onDailyCheckInPress: () => void;
  onHabitTargetsToggled?: () => void;
};

const HABIT_TARGET_DEFAULTS: Record<
  HabitId,
  { icon: string; label: string; defaultTarget: number; unit: string; min: number }
> = {
  exercise: { icon: "barbell-outline", label: "Exercise", defaultTarget: defaultHabitTargets.exercise, unit: "min", min: habitTargetMinimums.exercise },
  reading: { icon: "book-outline", label: "Reading", defaultTarget: defaultHabitTargets.reading, unit: "min", min: habitTargetMinimums.reading },
  journaling: { icon: "create-outline", label: "Journaling", defaultTarget: defaultHabitTargets.journaling, unit: "min", min: habitTargetMinimums.journaling },
  water: { icon: "water-outline", label: "Water", defaultTarget: defaultHabitTargets.water, unit: "glasses", min: habitTargetMinimums.water },
  sleep: { icon: "moon-outline", label: "Sleep", defaultTarget: defaultHabitTargets.sleep, unit: "hours", min: habitTargetMinimums.sleep },
  outdoors: { icon: "leaf-outline", label: "Outdoors", defaultTarget: defaultHabitTargets.outdoors, unit: "minutes", min: habitTargetMinimums.outdoors },
};

const ALL_HABIT_IDS = Object.keys(HABIT_TARGET_DEFAULTS) as HabitId[];

function HabitTargetRow({
  habitId,
  override,
  disabled,
  enabled,
  isFirstEnabled,
  isLastEnabled,
  onAdjust,
  onMoveDown,
  onMoveUp,
  onToggleEnabled
}: {
  habitId: HabitId;
  override: number | undefined;
  disabled: boolean;
  enabled: boolean;
  isFirstEnabled: boolean;
  isLastEnabled: boolean;
  onAdjust: (delta: number) => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onToggleEnabled: () => void;
}) {
  const config = HABIT_TARGET_DEFAULTS[habitId];
  const value = override ?? config.defaultTarget;
  const atMin = value <= config.min;
  const toggleDisabled = disabled || (enabled && isFirstEnabled && isLastEnabled);
  const moveUpDisabled = disabled || !enabled || isFirstEnabled;
  const moveDownDisabled = disabled || !enabled || isLastEnabled;

  return (
    <View
      className={`min-h-24 flex-row items-center rounded-card border px-3 py-2 ${
        enabled ? "border-line bg-surface-card" : "border-line-muted bg-surface-muted"
      }`}
    >
      <TouchableOpacity
        className={`h-8 w-8 shrink-0 items-center justify-center rounded-card border ${
          enabled ? "border-primary bg-primary-soft" : "border-line bg-surface-panel"
        }`}
        activeOpacity={0.7}
        accessibilityLabel={`${enabled ? "Remove" : "Add"} ${config.label} habit`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: enabled, disabled: toggleDisabled }}
        disabled={toggleDisabled}
        onPress={onToggleEnabled}
        style={{ opacity: toggleDisabled ? 0.45 : 1 }}
      >
        <Ionicons
          name={enabled ? "checkbox" : "square-outline"}
          size={19}
          color={enabled ? colors.blueDark : colors.grayIcon}
        />
      </TouchableOpacity>

      <View className="ml-3 min-w-0 flex-1 justify-center">
        <Text
          className={`text-sm font-black ${enabled ? "text-content" : "text-content-muted"}`}
          numberOfLines={1}
        >
          {config.label}
        </Text>

        <View className="mt-1 flex-row items-center">
          <Text className="mr-2 text-xs font-bold text-content-muted">Target</Text>
          <TouchableOpacity
            className="h-7 w-7 shrink-0 items-center justify-center rounded-card border border-line bg-surface-panel"
            disabled={disabled || atMin}
            style={{ opacity: disabled || atMin ? 0.45 : 1 }}
            activeOpacity={0.7}
            accessibilityLabel={`Decrease ${config.label} target`}
            onPress={() => onAdjust(-1)}
          >
            <Ionicons name="remove" size={14} color={atMin ? colors.grayIcon : colors.ink} />
          </TouchableOpacity>
          <Text
            className="mx-2 text-sm font-black text-content"
            style={{ fontVariant: ["tabular-nums"], minWidth: 28, textAlign: "center" }}
          >
            {value}
          </Text>
          <TouchableOpacity
            className="h-7 w-7 shrink-0 items-center justify-center rounded-card border border-line bg-surface-panel"
            disabled={disabled}
            style={{ opacity: disabled ? 0.45 : 1 }}
            activeOpacity={0.7}
            accessibilityLabel={`Increase ${config.label} target`}
            onPress={() => onAdjust(1)}
          >
            <Ionicons name="add" size={14} color={colors.ink} />
          </TouchableOpacity>
          <Text className="ml-2 shrink text-xs font-bold text-content-muted" numberOfLines={1}>
            {config.unit}
          </Text>
        </View>
      </View>

      <View className="ml-2 shrink-0 items-center justify-center">
        <TouchableOpacity
          className="h-8 w-9 items-center justify-center"
          activeOpacity={0.7}
          accessibilityLabel={`Move ${config.label} up`}
          accessibilityRole="button"
          accessibilityState={{ disabled: moveUpDisabled }}
          disabled={moveUpDisabled}
          onPress={onMoveUp}
          style={{ opacity: moveUpDisabled ? 0.3 : 1 }}
        >
          <Ionicons name="caret-up-outline" size={29} color={enabled ? colors.blueDark : colors.grayIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          className="h-8 w-9 items-center justify-center"
          activeOpacity={0.7}
          accessibilityLabel={`Move ${config.label} down`}
          accessibilityRole="button"
          accessibilityState={{ disabled: moveDownDisabled }}
          disabled={moveDownDisabled}
          onPress={onMoveDown}
          style={{ opacity: moveDownDisabled ? 0.3 : 1 }}
        >
          <Ionicons name="caret-down-outline" size={29} color={enabled ? colors.blueDark : colors.grayIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onToggle
}: {
  icon: string;
  label: string;
  value: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center">
        <Ionicons name={icon as never} size={18} color={colors.muted} />
        <Text className="ml-2 text-sm font-semibold text-content">{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.graySoft, true: colors.blueSoft }}
        thumbColor={value ? colors.blueDark : colors.grayIcon}
      />
    </View>
  );
}

export function MoreScreen({
  expandHabitTargets,
  onDailyCheckInPress,
  onHabitTargetsToggled
}: MoreScreenProps) {
  const insets = useSafeAreaInsets();
  const { isGuest, isSubmitting: isSigningOut, signOut, user } = useAuth();
  const { settings, targetOverrides } = useGameSettings();
  const { habitList } = useGameHabits();
  const { mutationInFlight } = useGameSync();
  const { setEnabledHabitIds, setTargetOverride, updateSettings } = useGameActions();
  const [optimistic, setOptimistic] = useState<AppSettings | null>(null);
  const [isHabitTargetsExpanded, setIsHabitTargetsExpanded] = useState(false);
  const [isResetConfirmVisible, setIsResetConfirmVisible] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [habitPreferenceError, setHabitPreferenceError] = useState<string | null>(null);
  const { medium } = useHaptics();

  const current = optimistic ?? settings;
  const contentPaddingBottom = Math.max(112, insets.bottom + 96);
  const isTargetUpdatePending = mutationInFlight === "settings";
  const enabledHabitIds = useMemo(() => habitList.map((habit) => habit.id), [habitList]);
  const orderedHabitIds = useMemo(
    () => [
      ...enabledHabitIds,
      ...ALL_HABIT_IDS.filter((habitId) => !enabledHabitIds.includes(habitId))
    ],
    [enabledHabitIds]
  );

  const persistHabitOrder = useCallback(
    (nextHabitIds: HabitId[]) => {
      setHabitPreferenceError(null);
      void setEnabledHabitIds(nextHabitIds).catch((error: unknown) => {
        setHabitPreferenceError(
          error instanceof Error ? error.message : "Lory could not save your habit arrangement."
        );
      });
    },
    [setEnabledHabitIds]
  );

  const toggleHabit = useCallback(
    (habitId: HabitId) => {
      const isEnabled = enabledHabitIds.includes(habitId);
      if (isEnabled && enabledHabitIds.length === 1) return;

      const nextHabitIds = isEnabled
        ? enabledHabitIds.filter((currentHabitId) => currentHabitId !== habitId)
        : [...enabledHabitIds, habitId];
      persistHabitOrder(nextHabitIds);
    },
    [enabledHabitIds, persistHabitOrder]
  );

  const moveHabit = useCallback(
    (habitId: HabitId, direction: -1 | 1) => {
      const index = enabledHabitIds.indexOf(habitId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= enabledHabitIds.length) return;

      const nextHabitIds = [...enabledHabitIds];
      [nextHabitIds[index], nextHabitIds[nextIndex]] = [nextHabitIds[nextIndex], nextHabitIds[index]];
      persistHabitOrder(nextHabitIds);
    },
    [enabledHabitIds, persistHabitOrder]
  );

  useEffect(() => {
    if (expandHabitTargets) {
      setIsHabitTargetsExpanded(true);
      onHabitTargetsToggled?.();
    }
  }, [expandHabitTargets, onHabitTargetsToggled]);

  const handleToggle = useCallback(
    (key: keyof AppSettings) => (nextValue: boolean) => {
      const next = { ...current, [key]: nextValue };
      setOptimistic(next);
      updateSettings({ [key]: nextValue } as Partial<AppSettings>)
        .then(() => setOptimistic(null))
        .catch(() => setOptimistic(null));
    },
    [current, updateSettings]
  );

  const handleResetTargets = useCallback(async () => {
    setIsResetting(true);
    medium();
    try {
      for (const habitId of ALL_HABIT_IDS) {
        await setTargetOverride(habitId, null);
      }
      setIsResetConfirmVisible(false);
    } catch {
      // Override reset is fire-and-forget per habit; individual failures are non-fatal.
    } finally {
      setIsResetting(false);
    }
  }, [setTargetOverride, medium]);

  const hasAnyOverride = ALL_HABIT_IDS.some(
    (habitId) => targetOverrides[habitId] !== undefined
  );

  return (
    <>
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
      >
        <ResourceBar onDailyCheckInPress={onDailyCheckInPress} />

        <View className="mt-5 rounded-card border border-line bg-surface-card p-4" style={shadows.card}>
          <Text className="text-sm font-black text-content">Settings</Text>

          <View className="mt-2 border-t border-line-subtle">
            <SettingsRow
              icon="volume-high-outline"
              label="Sound Effects"
              value={current.soundEnabled}
              onToggle={handleToggle("soundEnabled")}
            />
          </View>

          <View className="border-t border-line-subtle">
            <SettingsRow
              icon="hand-left-outline"
              label="Haptics"
              value={current.hapticsEnabled}
              onToggle={handleToggle("hapticsEnabled")}
            />
          </View>

          <View className="border-t border-line-subtle">
            <SettingsRow
              icon="notifications-outline"
              label="Daily Reminder"
              value={current.dailyReminderEnabled}
              onToggle={handleToggle("dailyReminderEnabled")}
            />
          </View>
        </View>

        <View className="mt-4 rounded-card border border-line bg-surface-card p-4" style={shadows.card}>
          <TouchableOpacity
            className="flex-row items-center justify-between"
            activeOpacity={0.7}
            accessibilityLabel={isHabitTargetsExpanded ? "Collapse habit targets" : "Expand habit targets"}
            accessibilityRole="button"
            onPress={() => setIsHabitTargetsExpanded((prev) => !prev)}
          >
            <Text className="text-sm font-black text-content">Habit Targets</Text>
            <Ionicons
              name={isHabitTargetsExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.muted}
            />
          </TouchableOpacity>

          {isHabitTargetsExpanded ? (
            <>
              <Text className="mt-1 text-xs font-semibold text-content-muted">
                Check habits to show them on Home, then use the arrows to arrange their order. Keep at least one habit selected.
              </Text>

              {habitPreferenceError ? (
                <Text className="mt-2 text-xs font-semibold leading-5 text-danger" accessibilityRole="alert">
                  {habitPreferenceError}
                </Text>
              ) : null}

              <View className="mt-2 gap-2 border-t border-line-subtle pt-2">
                {orderedHabitIds.map((habitId) => {
                  const enabled = enabledHabitIds.includes(habitId);
                  const enabledIndex = enabledHabitIds.indexOf(habitId);
                  return (
                    <View key={habitId}>
                      <HabitTargetRow
                        habitId={habitId}
                        override={targetOverrides[habitId]}
                        disabled={isTargetUpdatePending}
                        enabled={enabled}
                        isFirstEnabled={enabledIndex === 0}
                        isLastEnabled={enabledIndex === enabledHabitIds.length - 1}
                        onAdjust={(delta) => {
                          const config = HABIT_TARGET_DEFAULTS[habitId];
                          const current = targetOverrides[habitId] ?? config.defaultTarget;
                          const next = Math.max(config.min, current + delta);
                          void setTargetOverride(
                            habitId,
                            next === config.defaultTarget ? null : next
                          ).catch(() => undefined);
                        }}
                        onMoveDown={() => moveHabit(habitId, 1)}
                        onMoveUp={() => moveHabit(habitId, -1)}
                        onToggleEnabled={() => toggleHabit(habitId)}
                      />
                    </View>
                  );
                })}
              </View>

              {hasAnyOverride ? (
                <QuestActionButton
                  accessibilityLabel="Reset all habit targets to defaults"
                  className="mt-3"
                  icon="refresh-outline"
                  label="Reset to default"
                  mode="tap"
                  onAction={() => setIsResetConfirmVisible(true)}
                  size="compact"
                  variant="danger"
                />
              ) : null}
            </>
          ) : null}
        </View>

        <View className="mt-4 rounded-card border border-line bg-surface-card p-4" style={shadows.card}>
          <Text className="text-sm font-black text-content">Account</Text>
          <Text className="mt-1 text-xs font-semibold text-content-muted" numberOfLines={1}>
            {isGuest ? "Guest progress is saved on this device" : user?.email ?? "Signed in to Loro"}
          </Text>
          <QuestActionButton
            accessibilityLabel={isGuest ? "Return to sign in" : "Sign out of Loro"}
            className="mt-4"
            icon={isGuest ? "person-add-outline" : "log-out-outline"}
            label={isGuest ? "Sign in or create account" : "Sign out"}
            loading={isSigningOut}
            mode="tap"
            onAction={() => void signOut().catch(() => undefined)}
            size="compact"
            variant={isGuest ? "secondary" : "danger"}
          />
        </View>
      </ScrollView>

      <ConfirmModal
        confirmLabel="Reset all targets"
        loading={isResetting}
        message="This will restore all habit quest targets to their default values. Your current overrides will be lost."
        onCancel={() => setIsResetConfirmVisible(false)}
        onConfirm={handleResetTargets}
        title="Reset habit targets?"
        visible={isResetConfirmVisible}
      />
    </>
  );
}
