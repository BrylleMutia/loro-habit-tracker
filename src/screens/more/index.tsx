import { useCallback, useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { QuestActionButton } from "../../components/QuestActionButton";
import { ResourceBar } from "../../components/ResourceBar";
import { colors } from "../../constants/colors";
import { habitOrder } from "../../constants/habits";
import { useAuth } from "../../contexts/authContext";
import { useGameActions, useGameSettings } from "../../contexts/appContext";
import { shadows } from "../../styles/shadows";
import type { AppSettings, HabitId } from "../../types/app";

type MoreScreenProps = {
  onDailyCheckInPress: () => void;
};

const HABIT_TARGET_DEFAULTS: Record<
  HabitId,
  { icon: string; label: string; defaultTarget: number; unit: string; min: number }
> = {
  exercise: { icon: "barbell-outline", label: "Exercise", defaultTarget: 15, unit: "min", min: 5 },
  reading: { icon: "book-outline", label: "Reading", defaultTarget: 10, unit: "min", min: 5 },
  journaling: { icon: "create-outline", label: "Journaling", defaultTarget: 5, unit: "min", min: 5 },
  water: { icon: "water-outline", label: "Water", defaultTarget: 8, unit: "glasses", min: 1 },
  sleep: { icon: "moon-outline", label: "Sleep", defaultTarget: 1, unit: "routine", min: 1 },
  outdoors: { icon: "leaf-outline", label: "Outdoors", defaultTarget: 1, unit: "visit", min: 1 },
};

function HabitTargetRow({
  habitId,
  override,
  onAdjust,
}: {
  habitId: HabitId;
  override: number | undefined;
  onAdjust: (delta: number) => void;
}) {
  const config = HABIT_TARGET_DEFAULTS[habitId];
  const value = override ?? config.defaultTarget;
  const atMin = value <= config.min;

  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center flex-1 mr-3">
        <Ionicons name={config.icon as never} size={18} color={colors.muted} />
        <Text className="ml-2 text-sm font-semibold text-content" numberOfLines={1}>
          {config.label}
        </Text>
      </View>
      <View className="flex-row items-center">
        <TouchableOpacity
          className="h-7 w-7 items-center justify-center rounded-card border border-line bg-surface-panel"
          disabled={atMin}
          activeOpacity={0.7}
          accessibilityLabel={`Decrease ${config.label} target`}
          onPress={() => onAdjust(-1)}
        >
          <Ionicons name="remove" size={14} color={atMin ? colors.grayIcon : colors.ink} />
        </TouchableOpacity>
        <Text className="mx-2 text-sm font-black text-content" style={{ fontVariant: ["tabular-nums"], minWidth: 36, textAlign: "center" }}>
          {value}{override !== undefined ? "" : "*"}
        </Text>
        <TouchableOpacity
          className="h-7 w-7 items-center justify-center rounded-card border border-line bg-surface-panel"
          activeOpacity={0.7}
          accessibilityLabel={`Increase ${config.label} target`}
          onPress={() => onAdjust(1)}
        >
          <Ionicons name="add" size={14} color={colors.ink} />
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

export function MoreScreen({ onDailyCheckInPress }: MoreScreenProps) {
  const { isGuest, isSubmitting: isSigningOut, signOut, user } = useAuth();
  const { settings, targetOverrides } = useGameSettings();
  const { setTargetOverride, updateSettings } = useGameActions();
  const [optimistic, setOptimistic] = useState<AppSettings | null>(null);

  const current = optimistic ?? settings;

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

  return (
    <ScrollView className="flex-1 px-5 pb-28 pt-4">
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
        <Text className="text-sm font-black text-content">Habit Targets</Text>
        <Text className="mt-1 text-xs font-semibold text-content-muted">
          Customize quest duration or daily goal per habit. Defaults are marked with *.
        </Text>

        <View className="mt-2 border-t border-line-subtle">
          {habitOrder.map((habitId) => (
            <View key={habitId} className="border-t border-line-subtle">
              <HabitTargetRow
                habitId={habitId}
                override={targetOverrides[habitId]}
                onAdjust={(delta) => {
                  const config = HABIT_TARGET_DEFAULTS[habitId];
                  const current = targetOverrides[habitId] ?? config.defaultTarget;
                  const next = Math.max(config.min, current + delta);
                  if (next === config.defaultTarget) {
                    setTargetOverride(habitId, null);
                  } else {
                    setTargetOverride(habitId, next);
                  }
                }}
              />
            </View>
          ))}
        </View>
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
  );
}
