import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { QuestActionButton } from "../components/QuestActionButton";
import { colors } from "../constants/colors";
import { images } from "../constants/images";
import { AppStateProvider, useGameActions, useGameSync } from "../contexts/appContext";
import { useAuth } from "../contexts/authContext";
import { AuthScreen } from "../screens/auth";
import { AuthLandingScreen, OnboardingScreen } from "../screens/onboarding";
import { habitOrder } from "../constants/habits";
import { createInitialAppState } from "../contexts/appContext/appState";
import { getLocalGameSnapshot } from "../services/localGameRepository";
import { writeCachedGameState } from "../services/gameCache";
import {
  readOnboardingCompleted,
  readOnboardingSession,
  writeOnboardingCompleted,
  writeOnboardingSession
} from "../services/onboardingSession";
import type { AuthView, OnboardingSession } from "../types/backend";
import { ONBOARDING_STARTER_REWARD } from "../utility/onboarding";
import { AppNavigator } from "./AppNavigator";

function getLocalDateKeyInTimeZone(timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function TrailLoadingScreen() {
  const { hasHydrated, syncError, syncStatus } = useGameSync();
  const { refreshGameState } = useGameActions();

  if (hasHydrated) return <AppNavigator />;

  return (
    <SafeAreaView className="flex-1 bg-canvas-sky">
      <StatusBar style="dark" />
      <LinearGradient
        colors={[colors.sky, colors.mint, colors.cream]}
        className="flex-1 items-center justify-center px-8"
      >
        <Image
          style={{ height: 112, width: 112 }}
          source={images.parrotMascot}
          resizeMode="contain"
          accessibilityLabel="Lory preparing the trail"
        />
        <Text className="mt-4 text-xl font-black text-content">
          {syncStatus === "error" ? "The trail needs another try" : "Preparing your trail..."}
        </Text>
        {syncError ? (
          <Text className="mt-2 text-center text-sm font-semibold leading-5 text-content-muted">
            {syncError.message}
          </Text>
        ) : syncStatus !== "offline" ? (
          <ActivityIndicator className="mt-4" color={colors.blueDark} />
        ) : null}
        {syncStatus === "error" || syncStatus === "offline" ? (
          <QuestActionButton
            className="mt-5 w-44"
            icon="refresh"
            label="Try again"
            mode="tap"
            onAction={() => void refreshGameState()}
          />
        ) : null}
      </LinearGradient>
    </SafeAreaView>
  );
}

export function RootGate() {
  const { continueAsGuest, session, status } = useAuth();
  const [onboardingSession, setOnboardingSession] = useState<OnboardingSession | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasLoadedOnboardingState, setHasLoadedOnboardingState] = useState(false);
  const [authMode, setAuthMode] = useState<"landing" | "auth" | "onboarding">("landing");
  const [authInitialView, setAuthInitialView] = useState<AuthView>("signIn");

  useEffect(() => {
    let isMounted = true;
    void Promise.all([readOnboardingSession(), readOnboardingCompleted()])
      .then(([stored, completed]) => {
        if (!isMounted) return;
        setOnboardingSession(stored);
        setHasCompletedOnboarding(completed || stored?.phase === "completed");
        if (stored && stored.phase !== "completed") setAuthMode("onboarding");
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) setHasLoadedOnboardingState(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (status === "signedIn" || status === "guest") {
      // Once an account/guest session is active, a later logout should return
      // to sign-in rather than reusing the sign-up handoff view.
      setAuthInitialView("signIn");
    }
  }, [status]);

  useEffect(() => {
    if (
      status === "signedOut" &&
      (hasCompletedOnboarding || onboardingSession?.phase === "completed") &&
      authMode !== "auth"
    ) {
      setAuthInitialView("signIn");
      setAuthMode("auth");
    }
  }, [authMode, hasCompletedOnboarding, onboardingSession?.phase, status]);

  const createSession = () => {
    if (onboardingSession?.phase && onboardingSession.phase !== "completed") {
      setAuthMode("onboarding");
      return;
    }

    if (hasCompletedOnboarding || onboardingSession?.phase === "completed") {
      setAuthInitialView("signUp");
      setAuthMode("auth");
      return;
    }

    const now = new Date().toISOString();
    const next: OnboardingSession = {
      importId:
        globalThis.crypto?.randomUUID?.() ??
        `onboarding-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      phase: "habits",
      selectedHabitIds: [],
      firstHabitId: null,
      onboardingQuestCompleted: false,
      starterReward: null,
      skippedForNow: false,
      source: "direct-signup",
      createdAt: now,
      updatedAt: now
    };
    setOnboardingSession(next);
    setAuthMode("onboarding");
    void writeOnboardingSession(next);
  };

  const persistOnboardingSession = async (next: OnboardingSession) => {
    setOnboardingSession(next);
    await writeOnboardingSession(next);
  };

  const initializeGuestState = async (next: OnboardingSession) => {
    const state = createInitialAppState({ playerId: "local-guest" });
    const enabledHabitIds = next.skippedForNow
      ? [...habitOrder]
      : next.selectedHabitIds.length > 0
        ? next.selectedHabitIds
        : [...habitOrder];
    const initialState = {
      ...state,
      activeHabitId: next.firstHabitId ?? enabledHabitIds[0] ?? "exercise",
      enabledHabitIds,
      coins: next.onboardingQuestCompleted
        ? state.coins + ONBOARDING_STARTER_REWARD.coins
        : state.coins,
      profile: next.onboardingQuestCompleted
        ? {
            ...state.profile,
            xp: state.profile.xp + ONBOARDING_STARTER_REWARD.xp
          }
        : state.profile,
      inventory: next.onboardingQuestCompleted
        ? {
            ...state.inventory,
            streakShields: state.inventory.streakShields + ONBOARDING_STARTER_REWARD.streakShields
          }
        : state.inventory
    };
    const localDateKey = getLocalDateKeyInTimeZone(initialState.settings.timeZone);
    await writeCachedGameState(
      "local-guest",
      getLocalGameSnapshot(initialState, localDateKey)
    );
  };

  const handleContinueAsGuest = async (next: OnboardingSession) => {
    const guestSession = { ...next, phase: "completed" as const, source: "guest-migration" as const };
    await initializeGuestState(guestSession);
    await writeOnboardingCompleted(true);
    setHasCompletedOnboarding(true);
    await persistOnboardingSession(guestSession);
    await continueAsGuest();
  };

  const openCreateAccount = async (next: OnboardingSession) => {
    const accountSession: OnboardingSession = {
      ...next,
      phase: "completed" as const,
      source: next.source === "guest-migration" ? "guest-migration" : "direct-signup"
    };
    // Persist the completed payload before mounting AuthScreen. Signup and
    // email verification read this record to perform the server import.
    await writeOnboardingSession(accountSession);
    setOnboardingSession(accountSession);
    setAuthInitialView("signUp");
    setAuthMode("auth");
  };

  if (status === "booting") {
    return (
      <View className="flex-1 items-center justify-center bg-canvas-sky">
        <ActivityIndicator color={colors.blueDark} />
      </View>
    );
  }

  if (status !== "signedIn" && status !== "guest" && !hasLoadedOnboardingState) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas-sky">
        <ActivityIndicator color={colors.blueDark} />
      </View>
    );
  }

  if (status === "guest") {
    return (
      <AppStateProvider key="local-guest" storageMode="local" userId="local-guest">
        <TrailLoadingScreen />
      </AppStateProvider>
    );
  }

  if (status !== "signedIn" || !session) {
    if (authMode === "onboarding" && onboardingSession) {
      return (
        <OnboardingScreen
          onBackToLanding={() => setAuthMode("landing")}
          onContinueAsGuest={handleContinueAsGuest}
          onCreateAccount={openCreateAccount}
          onSessionChange={persistOnboardingSession}
          session={onboardingSession}
        />
      );
    }

    if (authMode === "landing") {
      return (
        <AuthLandingScreen
          onGetStarted={createSession}
          onLogin={() => {
            setAuthInitialView("signIn");
            setAuthMode("auth");
          }}
        />
      );
    }

    return (
      <AuthScreen
        initialView={authInitialView}
        onCreateAccount={createSession}
      />
    );
  }

  return (
    <AppStateProvider key={session.user.id} userId={session.user.id}>
      <TrailLoadingScreen />
    </AppStateProvider>
  );
}
