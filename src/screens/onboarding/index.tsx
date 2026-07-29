import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";

import { QuestActionButton } from "../../components/QuestActionButton";
import { QuestCelebrationModal } from "../../components/QuestCelebrationModal";
import { createInitialHabits, getHabitCatalog } from "../../constants/habits";
import { colors } from "../../constants/colors";
import { images } from "../../constants/images";
import { useScreenContentWidth } from "../../hooks/useScreenContentWidth";
import { shadows } from "../../styles/shadows";
import type { HabitId } from "../../types/app";
import type { OnboardingPhase, OnboardingSession } from "../../types/backend";
import { getActiveNodeLocation } from "../../utility/adventurePath";
import { getEffectiveHabitTarget, getDailyQuestSummary } from "../../utility/habitTargets";
import {
  ONBOARDING_STARTER_REWARD,
  toggleOnboardingHabitSelection
} from "../../utility/onboarding";

type OnboardingScreenProps = {
  onBackToLanding: () => void;
  onContinueAsGuest: (session: OnboardingSession) => Promise<void>;
  onCreateAccount: (session: OnboardingSession) => Promise<void>;
  onSessionChange: (session: OnboardingSession) => Promise<void>;
  session: OnboardingSession;
};

type AuthLandingProps = {
  onGetStarted: () => void;
  onLogin: () => void;
};

const guestOnboardingSyncItems = [
  "Selected habits and their order",
  "Your first trail marker and completed intro quest",
  "One fixed starter reward, if eligible: +10 XP, +10 coins, and +1 streak shield"
] as const;

const guestVerifiedAccountSyncItems = [
  "Profile name and avatar",
  ...guestOnboardingSyncItems
] as const;

const guestNonSyncItems = [
  "Coins or XP earned after entering guest mode",
  "Streaks, shields beyond the fixed starter shield, loot, inventory, or equipment",
  "Daily quest completions, activity history, and other arbitrary local progress"
] as const;

const onboardingHabitDescriptions: Record<HabitId, string> = {
  exercise: "Let's move, build strength, and earn today's win!",
  reading: "Let's turn a few pages and uncover something new!",
  journaling: "Take a quiet moment to capture a thought.",
  water: "Time to refill and keep your energy flowing!",
  sleep: "Let's prepare a calm landing for tomorrow.",
  outdoors: "Step outside, breathe deeply, and explore."
};

const onboardingHabitVisuals: Record<
  HabitId,
  { backgroundClassName: string; iconColor: string }
> = {
  exercise: {
    backgroundClassName: "bg-primary-soft",
    iconColor: colors.blueDark
  },
  reading: {
    backgroundClassName: "bg-rarity-epic-soft",
    iconColor: colors.rarity.epic
  },
  journaling: {
    backgroundClassName: "bg-surface-red",
    iconColor: colors.red
  },
  water: {
    backgroundClassName: "bg-primary-pale",
    iconColor: colors.blue
  },
  sleep: {
    backgroundClassName: "bg-rarity-epic-soft",
    iconColor: colors.rarity.epic
  },
  outdoors: {
    backgroundClassName: "bg-success-soft",
    iconColor: colors.green
  }
};

function ProgressDots({
  compact = false,
  phase
}: {
  compact?: boolean;
  phase: OnboardingPhase;
}) {
  const current = phase === "habits" ? 1 : phase === "quest" ? 2 : 3;
  return (
    <View
      className={`flex-row items-center justify-center ${compact ? "gap-1.5" : "gap-2"}`}
      accessibilityLabel={`Onboarding step ${current} of 3`}
    >
      {[1, 2, 3].map((step) => (
        <View
          key={step}
          className={`${compact ? "h-1" : "h-2"} rounded-pill ${
            step === current
              ? `${compact ? "w-5" : "w-10"} bg-primary-strong`
              : `${compact ? "w-2.5" : "w-2"} bg-line-blue-muted`
          }`}
        />
      ))}
    </View>
  );
}

function PageHeader({
  compact = false,
  eyebrow,
  onBack,
  onForward,
  phase,
  title
}: {
  compact?: boolean;
  eyebrow?: string;
  onBack?: () => void;
  onForward?: () => void;
  phase: OnboardingPhase;
  title: string;
}) {
  return (
    <View className={compact ? "gap-3" : "gap-4"}>
      <View className="flex-row items-center justify-between">
        {onBack ? (
          <Pressable
            className={`${compact ? "h-7 w-7 rounded-full" : "h-11 w-11 rounded-card"} items-center justify-center border border-line-blue bg-surface-card`}
            style={compact ? shadows.card : undefined}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={compact ? 8 : 6}
            onPress={onBack}
          >
            <Ionicons name="chevron-back" size={compact ? 16 : 24} color={compact ? colors.muted : colors.ink} />
          </Pressable>
        ) : (
          <View className={compact ? "h-7 w-7" : "h-11 w-11"} />
        )}
        <ProgressDots compact={compact} phase={phase} />
        {onForward ? (
          <Pressable
            className={`${compact ? "h-7 w-7 rounded-full" : "h-11 w-11 rounded-card"} items-center justify-center border border-line-blue bg-surface-card`}
            style={compact ? shadows.card : undefined}
            accessibilityLabel="Continue to your ready trail"
            accessibilityRole="button"
            hitSlop={compact ? 8 : 6}
            onPress={onForward}
          >
            <Ionicons name="chevron-forward" size={compact ? 16 : 24} color={compact ? colors.muted : colors.ink} />
          </Pressable>
        ) : (
          <View className={compact ? "h-7 w-7" : "h-11 w-11"} />
        )}
      </View>
      <View className="items-center">
        {eyebrow ? <Text className="text-xs font-black uppercase tracking-widest text-primary-strong">{eyebrow}</Text> : null}
        <Text className={`${compact ? "mt-1 text-xl" : "mt-2 text-3xl"} text-center font-black text-content`}>{title}</Text>
      </View>
    </View>
  );
}

function OnboardingIllustration({
  accessibilityLabel,
  source,
  style
}: {
  accessibilityLabel: string;
  source: ImageSourcePropType;
  style: { height: number; width: number | `${number}%` };
}) {
  const [hasLoadError, setHasLoadError] = useState(false);

  return (
    <Image
      accessibilityLabel={accessibilityLabel}
      onError={() => setHasLoadError(true)}
      resizeMode="contain"
      source={hasLoadError ? images.parrotMascot : source}
      style={style}
    />
  );
}

function GuestDataWarningModal({
  confirming,
  onCancel,
  onConfirm,
  visible
}: {
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  visible: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <Modal animationType={reduceMotion ? "none" : "fade"} transparent visible={visible} onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/35 px-5">
        <View className="max-h-[88%] w-full max-w-xl rounded-3xl border border-line bg-surface-card p-5" style={shadows.card}>
          <ScrollView contentContainerStyle={{ gap: 14 }} showsVerticalScrollIndicator={false}>
            <View className="items-center">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
                <Ionicons name="cloud-upload-outline" size={28} color={colors.blueDark} />
              </View>
              <Text className="mt-3 text-center text-2xl font-black text-content">Continue as a guest?</Text>
              <Text className="mt-2 text-center text-sm font-semibold leading-5 text-content-muted">
                Your trail will stay on this device while you use guest mode. If you later create a verified account, only the bounded items listed below will be carried over.
              </Text>
            </View>

            <View className="rounded-card border border-line-green bg-surface-green p-4">
              <Text className="text-sm font-black text-content">Will sync if you create a verified account</Text>
              {guestVerifiedAccountSyncItems.map((item) => (
                <View key={item} className="mt-2 flex-row items-start gap-2">
                  <Ionicons name="cloud-done-outline" size={17} color={colors.green} />
                  <Text className="flex-1 text-sm font-semibold leading-5 text-content">{item}</Text>
                </View>
              ))}
            </View>

            <View className="rounded-card border border-line bg-surface-soft p-4">
              <Text className="text-sm font-black text-content">Will not sync from guest mode</Text>
              {guestNonSyncItems.map((item) => (
                <View key={item} className="mt-2 flex-row items-start gap-2">
                  <Ionicons name="remove-circle-outline" size={17} color={colors.grayIcon} />
                  <Text className="flex-1 text-sm font-semibold leading-5 text-content-muted">{item}</Text>
                </View>
              ))}
            </View>

            <QuestActionButton
              disabled={confirming}
              icon="compass-outline"
              label="Use guest mode"
              loading={confirming}
              mode="tap"
              onAction={onConfirm}
            />
            <QuestActionButton
              disabled={confirming}
              icon="arrow-back"
              label="Go back"
              mode="tap"
              onAction={onCancel}
              variant="secondary"
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function GuestMigrationWarningModal({
  onCancel,
  onConfirm,
  visible
}: {
  onCancel: () => void;
  onConfirm: () => void;
  visible: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <Modal animationType={reduceMotion ? "none" : "fade"} transparent visible={visible} onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/35 px-5">
        <View className="max-h-[88%] w-full max-w-xl rounded-3xl border border-line bg-surface-card p-5" style={shadows.card}>
          <ScrollView contentContainerStyle={{ gap: 14 }} showsVerticalScrollIndicator={false}>
            <View className="items-center">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
                <Ionicons name="cloud-done-outline" size={28} color={colors.blueDark} />
              </View>
              <Text className="mt-3 text-center text-2xl font-black text-content">Save your guest progress?</Text>
              <Text className="mt-2 text-center text-sm font-semibold leading-5 text-content-muted">
                Before you create a verified account, review exactly what will sync. Only the bounded onboarding result is imported; the rest stays guest-only. Your guest data stays on this device unless the import succeeds.
              </Text>
            </View>
            <View className="rounded-card border border-line-green bg-surface-green p-4">
              <Text className="text-sm font-black text-content">Will sync to your verified account</Text>
              {guestVerifiedAccountSyncItems.map((item) => (
                <View key={item} className="mt-2 flex-row items-start gap-2">
                  <Ionicons name="checkmark-circle" size={17} color={colors.green} />
                  <Text className="flex-1 text-sm font-semibold leading-5 text-content">{item}</Text>
                </View>
              ))}
            </View>
            <View className="rounded-card border border-line bg-surface-soft p-4">
              <Text className="text-sm font-black text-content">Will not sync from guest mode</Text>
              {guestNonSyncItems.map((item) => (
                <View key={item} className="mt-2 flex-row items-start gap-2">
                  <Ionicons name="remove-circle-outline" size={17} color={colors.grayIcon} />
                  <Text className="flex-1 text-sm font-semibold leading-5 text-content-muted">{item}</Text>
                </View>
              ))}
            </View>
            <QuestActionButton icon="cloud-upload-outline" label="Save and create account" mode="tap" onAction={onConfirm} />
            <QuestActionButton icon="arrow-back" label="Go back" mode="tap" onAction={onCancel} variant="secondary" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function AuthLandingScreen({ onGetStarted, onLogin }: AuthLandingProps) {
  const contentWidth = useScreenContentWidth();

  return (
    <SafeAreaView className="flex-1 bg-canvas-sky">
      <StatusBar style="dark" />
      <LinearGradient colors={[colors.sky, colors.mint, colors.cream]} className="flex-1">
        <ScrollView
          contentContainerStyle={{ alignItems: "center", flexGrow: 1, justifyContent: "center", padding: 20 }}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full items-center rounded-3xl border border-line bg-surface-card px-5 pb-6 pt-8" style={[{ maxWidth: contentWidth + 40 }, shadows.card]}>
            <OnboardingIllustration
              accessibilityLabel="Lory, the Trail Captain"
              source={images.onboarding.welcome}
              style={{ height: 230, width: "100%" }}
            />
            <Text className="mt-4 text-center text-3xl font-black text-content">Start your adventure</Text>
            <Text className="mt-2 text-center text-sm font-semibold leading-6 text-content-muted">
              Personalize a trail with Lory, then decide whether to save it to an account.
            </Text>
            <View className="mt-6 w-full gap-3">
              <QuestActionButton icon="sparkles" label="Get Started" mode="tap" onAction={onGetStarted} />
              <QuestActionButton icon="log-in-outline" label="I already have an account" mode="tap" onAction={onLogin} variant="secondary" />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

export function OnboardingScreen({
  onBackToLanding,
  onContinueAsGuest,
  onCreateAccount,
  onSessionChange,
  session
}: OnboardingScreenProps) {
  const [isGuestWarningVisible, setIsGuestWarningVisible] = useState(false);
  const [isStartingGuest, setIsStartingGuest] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [isOpeningAccount, setIsOpeningAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [isIntroCelebrationVisible, setIsIntroCelebrationVisible] = useState(false);
  const [isSavingIntroQuest, setIsSavingIntroQuest] = useState(false);
  const [introQuestError, setIntroQuestError] = useState<string | null>(null);
  const catalog = useMemo(() => getHabitCatalog(), []);
  const initialHabits = useMemo(() => createInitialHabits(), []);
  const selectedIds = new Set(session.selectedHabitIds);
  const update = (patch: Partial<OnboardingSession>) => {
    void onSessionChange({ ...session, ...patch, updatedAt: new Date().toISOString() });
  };

  const toggleHabit = (habitId: HabitId) => {
    const next = toggleOnboardingHabitSelection(session.selectedHabitIds, habitId);
    update({
      phase: "habits",
      selectedHabitIds: next,
      firstHabitId: next[0] ?? null,
      onboardingQuestCompleted: false,
      starterReward: null,
      skippedForNow: false
    });
  };

  const skipForNow = () => {
    const allHabitIds = catalog.map((habit) => habit.id);
    update({
      phase: "quest",
      selectedHabitIds: allHabitIds,
      firstHabitId: allHabitIds[0] ?? null,
      onboardingQuestCompleted: false,
      starterReward: null,
      skippedForNow: true
    });
  };

  const openCreateAccount = () => {
    if (isOpeningAccount) return;
    setAccountError(null);
    setIsOpeningAccount(true);
    void onCreateAccount(session)
      .catch((error: unknown) => {
        setAccountError(
          error instanceof Error ? error.message : "Lory could not prepare your account yet."
        );
      })
      .finally(() => setIsOpeningAccount(false));
  };

  const completeIntroQuest = () => {
    if (isSavingIntroQuest) return;
    if (session.onboardingQuestCompleted) {
      setIsIntroCelebrationVisible(true);
      return;
    }

    const nextSession: OnboardingSession = {
      ...session,
      phase: "ready",
      onboardingQuestCompleted: true,
      starterReward: ONBOARDING_STARTER_REWARD,
      updatedAt: new Date().toISOString()
    };
    setIntroQuestError(null);
    setIsSavingIntroQuest(true);
    void onSessionChange(nextSession)
      .then(() => setIsIntroCelebrationVisible(true))
      .catch((error: unknown) => {
        setIntroQuestError(error instanceof Error ? error.message : "Lory could not save that quest yet.");
      })
      .finally(() => setIsSavingIntroQuest(false));
  };

  const renderHabits = () => (
    <View className="flex-1 self-center px-2.5" style={{ maxWidth: 420, width: "100%" }}>
      <PageHeader compact onBack={onBackToLanding} phase="habits" title="Choose your trail" />
      <View className="mt-2 items-center px-2">
        <Text className="max-w-[18rem] text-center text-xs font-semibold leading-4 text-content-muted">
          Pick any habits that feel useful today.{"\n"}You can change this later.
        </Text>
        <View className="mt-2 rounded-pill bg-surface-blue px-3 py-1">
          <Text className="text-center text-xs font-black text-primary-strong">
            {session.selectedHabitIds.length} {session.selectedHabitIds.length === 1 ? "habit" : "habits"} selected
          </Text>
        </View>
      </View>
      <View className="mt-4 gap-2.5">
        {catalog.map((habit) => {
          const isSelected = selectedIds.has(habit.id);
          const visual = onboardingHabitVisuals[habit.id];
          return (
            <Pressable
              key={habit.id}
              className={`min-h-14 flex-row items-center rounded-card border px-2.5 py-2 ${
                isSelected
                  ? "border-primary-strong bg-surface-blue"
                  : "border-transparent bg-surface-card"
              }`}
              style={shadows.card}
              accessibilityLabel={`${habit.label}, ${isSelected ? "selected" : "not selected"}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              onPress={() => toggleHabit(habit.id)}
            >
              <View className={`h-8 w-8 items-center justify-center rounded-lg ${visual.backgroundClassName}`}>
                <Ionicons name={habit.icon} size={18} color={visual.iconColor} />
              </View>
              <View className="ml-2.5 min-w-0 flex-1">
                <Text className="text-xs font-black text-content">{habit.label}</Text>
                <Text className="text-[9px] font-semibold leading-3 text-content-muted" numberOfLines={2}>
                  {onboardingHabitDescriptions[habit.id]}
                </Text>
              </View>
              <View className={`ml-2 h-5 w-5 items-center justify-center rounded-full border-2 ${isSelected ? "border-primary-strong bg-primary-strong" : "border-line-blue bg-surface-card"}`}>
                {isSelected ? <Ionicons name="checkmark" size={13} color="white" /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <QuestActionButton
        className="mt-7"
        disabled={session.selectedHabitIds.length === 0}
        icon="arrow-forward"
        iconPosition="right"
        label="Continue to first quest"
        mode="tap"
        onAction={() => update({ phase: "quest" })}
        size="compact"
      />
      <Pressable className="min-h-11 items-center justify-center" accessibilityRole="button" onPress={skipForNow}>
        <Text className="text-xs font-black text-content-muted">Skip for now</Text>
      </Pressable>
    </View>
  );

  const renderQuest = () => {
    const firstHabit = catalog.find((habit) => habit.id === session.firstHabitId) ?? catalog[0];
    const habitState = firstHabit ? initialHabits[firstHabit.id] : undefined;
    const activeLocation = habitState ? getActiveNodeLocation(habitState) : null;
    const activeNode = activeLocation?.node;
    const target = firstHabit && activeNode
      ? getEffectiveHabitTarget(firstHabit.id, activeNode, undefined)
      : null;
    const targetLabel = (() => {
      const value = target ?? 0;
      switch (firstHabit?.id) {
        case "exercise":
          return `${value} minutes of exercise`;
        case "reading":
          return `${value} minutes of reading`;
        case "journaling":
          return `${value} minutes of journaling`;
        case "water":
          return `${value} glasses of water`;
        case "sleep":
          return `${value} hours of sleep`;
        case "outdoors":
          return `${value} minutes outdoors`;
        default:
          return activeNode?.questType === "timed"
            ? `${value} minutes`
            : `${value} ${activeNode?.targetUnit ?? "units"}`;
      }
    })();
    const questSummary = firstHabit && activeNode && target !== null
      ? getDailyQuestSummary(firstHabit.id, activeNode.title, target)
      : "Complete one small, clear action for your selected habit.";
    return (
      <>
        <PageHeader
          onBack={() => update({ phase: "habits" })}
          onForward={session.onboardingQuestCompleted ? () => update({ phase: "ready" }) : undefined}
          phase="quest"
          title="Try one small win"
        />
        <View className="flex mt-auto mb-auto w-full flex-col items-center justify-center">
          <View>
          <View className="items-center rounded-3xl border border-line bg-surface-card p-5" style={shadows.card}>
            <OnboardingIllustration accessibilityLabel="Lory ready for a first quest" source={images.onboarding.questReward} style={{ height: 190, width: "100%" }} />
            <View className="w-full rounded-card border border-line-blue bg-primary-soft p-4">
              <Text className="text-xs font-black uppercase tracking-widest text-primary-strong">Quest goal</Text>
              <Text className="mt-2 text-xl font-black text-content">{firstHabit?.label ?? "Your first habit"}</Text>
              <Text className="mt-2 text-sm font-semibold leading-5 text-content-muted">{questSummary}</Text>
            </View>
            {introQuestError ? <Text className="text-center text-sm font-semibold leading-5 text-danger">{introQuestError} Try again.</Text> : null}
              <View className="mt-5">
                <QuestActionButton
                  completed={session.onboardingQuestCompleted}
                  completedLabel="Quest cleared"
                  disabled={session.onboardingQuestCompleted}
                  icon="checkmark-circle-outline"
                  label="Complete intro quest"
                  loading={isSavingIntroQuest}
                  mode="hold"
                  onAction={completeIntroQuest}
                  />
              </View>
            </View>
          </View>
        </View>
      </>
    );
  };

  const renderReady = () => (
    <>
      <PageHeader onBack={() => update({ phase: "quest" })} phase="ready" title="Your trail is ready!" />
        <View className="flex mt-auto mb-auto w-full items-center justify-center">
          <View>
            <View className="items-center rounded-3xl border border-line bg-surface-card p-5" style={shadows.card}>
              <OnboardingIllustration accessibilityLabel="Lory beside a ready trail" source={images.onboarding.trailReady} style={{ height: 210, width: "100%" }} />
              <Text className="mt-2 text-center text-sm font-semibold leading-5 text-content-muted">
                Lory saved your starting point. You can save it to an account or keep exploring on this device.
              </Text>
              <View className="mt-4 w-full flex-row flex-wrap justify-center gap-2">
                {session.selectedHabitIds.map((habitId) => {
                  const habit = catalog.find((item) => item.id === habitId);
                  return habit ? (
                    <View key={habit.id} className="flex-row items-center rounded-pill border border-line-blue bg-primary-soft px-3 py-2">
                      <Ionicons name={habit.icon} size={15} color={colors.blueDark} />
                      <Text className="ml-1 text-xs font-black text-primary-strong">{habit.label}</Text>
                    </View>
                  ) : null;
                })}
              </View>
              <View className="flex mt-5 gap-3">
                <QuestActionButton
                  disabled={isOpeningAccount}
                  icon="person-add-outline"
                  label="Create an account"
                  loading={isOpeningAccount}
                  mode="tap"
                  onAction={openCreateAccount}
                />
                {accountError ? (
                  <Text className="text-center text-sm font-semibold leading-5 text-danger">
                    {accountError} Try again when you are ready.
                  </Text>
                ) : null}
                <QuestActionButton
                  icon="compass-outline"
                  label="Continue as a guest"
                  mode="tap"
                  onAction={() => {
                    setGuestError(null);
                    setIsGuestWarningVisible(true);
                  }}
                  variant="secondary"
                />
                {guestError ? (
                  <Text className="text-center text-sm font-semibold leading-5 text-danger">
                    {guestError} Try again when you are ready.
                  </Text>
                ) : null}
            </View>
          </View>
        </View>
      </View>
      <GuestDataWarningModal
        onCancel={() => {
          setGuestError(null);
          setIsGuestWarningVisible(false);
        }}
        onConfirm={() => {
          if (isStartingGuest) return;
          setGuestError(null);
          setIsStartingGuest(true);
          void onContinueAsGuest({ ...session, phase: "completed", source: "guest-migration" })
            .then(() => setIsGuestWarningVisible(false))
            .catch((error: unknown) => {
              setGuestError(error instanceof Error ? error.message : "Lory could not start guest mode.");
            })
            .finally(() => setIsStartingGuest(false));
        }}
        confirming={isStartingGuest}
        visible={isGuestWarningVisible}
      />
    </>
  );

  return (
    <SafeAreaView className="flex-1 bg-canvas-sky">
      <StatusBar style="dark" />
      <LinearGradient
        colors={session.phase === "habits" ? [colors.blueSoft, colors.card] : [colors.sky, colors.mint, colors.cream]}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ alignSelf: "center", flexGrow: 1, gap: 16, padding: 20, width: "100%" }}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {session.phase === "habits" ? renderHabits() : null}
          {session.phase === "quest" ? renderQuest() : null}
          {session.phase === "ready" || session.phase === "completed" || session.phase === "guest-confirmation" ? renderReady() : null}
        </ScrollView>
      </LinearGradient>
      <QuestCelebrationModal
        onClose={() => setIsIntroCelebrationVisible(false)}
        onTrailStampAction={() => setIsIntroCelebrationVisible(false)}
        trailStampActionMode="tap"
        trailStampDetails={{
          actionLabel: "Continue to your trail",
          badgeLabel: "Intro quest cleared",
          coinReward: ONBOARDING_STARTER_REWARD.coins,
          description: `${catalog.find((habit) => habit.id === session.firstHabitId)?.label ?? "Your habit"} is now part of your trail. Your bounded starter rewards are ready when you choose guest mode or create an account.`,
          shieldReward: ONBOARDING_STARTER_REWARD.streakShields,
          title: "Quest cleared",
          xpReward: ONBOARDING_STARTER_REWARD.xp
        }}
        variant={isIntroCelebrationVisible ? "trail-stamp" : null}
      />
    </SafeAreaView>
  );
}
