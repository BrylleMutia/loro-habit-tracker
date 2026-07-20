import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AvatarClassSelector } from "../../components/AvatarClassSelector";
import { AuthField } from "../../components/AuthField";
import { QuestActionButton } from "../../components/QuestActionButton";
import { getAvatarVariant, type AvatarGender } from "../../constants/avatarClasses";
import { colors } from "../../constants/colors";
import { images } from "../../constants/images";
import { useAuth } from "../../contexts/authContext";
import { useScreenContentWidth } from "../../hooks/useScreenContentWidth";
import { shadows } from "../../styles/shadows";
import type { AvatarClassId } from "../../types/app";

type HeroVariant = keyof typeof images.authHeroes;

const authHeroImageStyle = {
  height: "100%",
  left: 0,
  position: "absolute",
  top: 0,
  width: "100%"
} as const;

function AuthMessage({ message, tone = "error" }: { message: string; tone?: "error" | "info" }) {
  return (
    <View
      className={`flex-row rounded-card border p-3 ${
        tone === "error" ? "border-line-red bg-surface-red" : "border-line-blue bg-primary-soft"
      }`}
      accessibilityRole="alert"
    >
      <Ionicons
        name={tone === "error" ? "alert-circle-outline" : "information-circle-outline"}
        size={18}
        color={tone === "error" ? colors.red : colors.blueDark}
      />
      <Text className="ml-2 flex-1 text-xs font-semibold leading-5 text-content">{message}</Text>
    </View>
  );
}

function TextAction({
  disabled = false,
  label,
  onPress
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="min-h-10 items-center justify-center px-2"
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
    >
      <Text className={`text-sm font-black ${disabled ? "text-content-subtle" : "text-primary-strong"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function BackButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      className="h-11 w-11 items-center justify-center rounded-card border border-line-blue bg-surface-card"
      style={shadows.card}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
    >
      <Ionicons name="chevron-back" size={25} color={colors.ink} />
    </Pressable>
  );
}

function SpeechBubble({ children, compact = false }: { children: string; compact?: boolean }) {
  return (
    <View
      className={`absolute rounded-card border border-line-reward bg-surface-card ${
        compact ? "right-3 top-3 w-44 p-3" : "right-4 top-16 w-60 p-4"
      }`}
      style={shadows.card}
    >
      <View
        className="absolute -left-2 bottom-4 h-4 w-4 border-b border-l border-line-reward bg-surface-card"
        style={{ transform: [{ rotate: "45deg" }] }}
      />
      <Text className={`${compact ? "text-sm leading-5" : "text-lg leading-6"} font-black text-content`}>
        {children}
      </Text>
    </View>
  );
}

function AuthHero({
  onBack,
  variant
}: {
  onBack?: () => void;
  variant: HeroVariant;
}) {
  const isLogin = variant === "login";

  return (
    <View
      className={`${isLogin ? "h-64" : "h-56"} overflow-hidden bg-canvas-sky`}
    >
      <Image
        resizeMode="cover"
        source={images.authHeroes[variant]}
        style={authHeroImageStyle}
        accessibilityLabel={`${variant} adventure scene with Lory`}
      />
      {onBack ? (
        <View className="absolute left-4 top-4 z-10">
          <BackButton label="Back to sign in" onPress={onBack} />
        </View>
      ) : null}
      {variant === "signup" ? (
        <SpeechBubble>Your first quest starts here!</SpeechBubble>
      ) : null}
      {variant === "verification" ? (
        <SpeechBubble compact>Check your email to unlock your first quest!</SpeechBubble>
      ) : null}
    </View>
  );
}

function VerificationSteps() {
  const steps = [
    { icon: "checkmark" as const, label: "Account", state: "done" },
    { icon: null, label: "Verify", state: "active" },
    { icon: "lock-closed" as const, label: "Ready", state: "locked" }
  ];

  return (
    <View className="relative mt-6 flex-row px-7">
      <View className="absolute left-16 right-16 top-5 h-px border-t border-dashed border-line-blue-muted" />
      {steps.map((step, index) => (
        <View key={step.label} className="z-10 flex-1 items-center">
          <View
            className={`h-10 w-10 items-center justify-center rounded-card border ${
              step.state === "done"
                ? "border-success bg-success"
                : step.state === "active"
                  ? "border-primary-strong bg-primary"
                  : "border-line-muted bg-line-disabled"
            }`}
          >
            {step.icon ? (
              <Ionicons name={step.icon} size={21} color="white" />
            ) : (
              <Text className="text-lg font-black text-white">{index + 1}</Text>
            )}
          </View>
          <Text
            className={`mt-2 text-sm font-bold ${
              step.state === "active" ? "text-primary-strong" : "text-content-muted"
            }`}
          >
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Divider() {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-px flex-1 bg-line" />
      <Text className="text-xs font-bold text-content-subtle">OR</Text>
      <View className="h-px flex-1 bg-line" />
    </View>
  );
}

function formatCooldown(seconds: number) {
  return `00:${String(seconds).padStart(2, "0")}`;
}

export function AuthScreen() {
  const authWidth = useScreenContentWidth() + 40;
  const {
    awaitingAction,
    continueAsGuest,
    errorMessage,
    isConfigured,
    isSubmitting,
    pendingEmail,
    refreshVerification,
    requestPasswordReset,
    resendVerification,
    returnToSignIn,
    setView,
    signIn,
    signUp,
    status,
    updatePassword,
    view
  } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [avatarClassId, setAvatarClassId] = useState<AvatarClassId>("warrior");
  const [avatarGender, setAvatarGender] = useState<AvatarGender>("male");
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const run = (request: () => Promise<void>) => {
    setLocalError(null);
    setNotice(null);
    void request().catch(() => undefined);
  };

  const submitSignUp = () => {
    if (password.length < 8) {
      setLocalError("Use at least 8 characters for your password.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Those passwords do not match yet.");
      return;
    }
    if (!acceptedTerms) {
      setLocalError("Accept the Terms and Privacy Policy to create an account.");
      return;
    }
    run(() =>
      signUp(
        displayName,
        email,
        password,
        avatarClassId,
        getAvatarVariant(avatarClassId, avatarGender)
      )
    );
  };

  const submitPasswordUpdate = () => {
    if (password.length < 8 || password !== confirmPassword) {
      setLocalError(
        password.length < 8
          ? "Use at least 8 characters for your new password."
          : "Those passwords do not match yet."
      );
      return;
    }
    run(() => updatePassword(password));
  };

  const messages = (
    <>
      {localError || errorMessage ? <AuthMessage message={localError ?? errorMessage ?? ""} /> : null}
      {!isConfigured ? (
        <AuthMessage
          message="Account sign-in needs the Supabase environment values. Guest mode is ready now."
          tone="info"
        />
      ) : null}
    </>
  );

  const resendEmail = () => {
    if (resendCooldown > 0) return;
    run(async () => {
      await resendVerification();
      setNotice("A new verification email is on its way.");
      setResendCooldown(60);
    });
  };

  const renderVerification = () => {
    const isPasswordReset = awaitingAction === "passwordReset";
    if (isPasswordReset) {
      return (
        <>
          <AuthHero variant="verification" />
          <View className="-mt-2 gap-4 rounded-t-3xl bg-surface-card px-5 pb-8 pt-7">
            <Text className="text-center text-3xl font-black text-content">Check your inbox</Text>
            <Text className="text-center text-sm font-semibold leading-6 text-content-muted">
              Open the recovery link sent to {pendingEmail ?? "your email"}.
            </Text>
            {messages}
            <QuestActionButton icon="arrow-back" label="Back to sign in" mode="tap" onAction={returnToSignIn} variant="secondary" />
          </View>
        </>
      );
    }

    return (
      <View className="pb-10">
        <View className="px-5 pt-2">
          <View className="relative h-12 items-center justify-center">
            <View className="absolute left-0"><BackButton label="Back to sign in" onPress={returnToSignIn} /></View>
            <Text className="text-2xl font-black text-content">Verification</Text>
          </View>
          <VerificationSteps />
        </View>
        <View className="mt-4"><AuthHero variant="verification" /></View>
        <View className="gap-4 px-5 pt-6">
          <View className="items-center">
            <Text className="text-center text-3xl font-black text-content">Check your inbox</Text>
            <Text className="mt-2 text-center text-sm font-semibold leading-6 text-content-muted">
              We sent an account confirmation link to
            </Text>
            <Text className="text-center text-base font-black text-content">
              {pendingEmail ?? "your email"}
            </Text>
          </View>
          <View className="flex-row rounded-card border border-line-blue bg-primary-soft p-4">
            <Ionicons name="mail-open-outline" size={23} color={colors.blueDark} />
            <Text className="ml-3 flex-1 text-sm font-semibold leading-6 text-content">
              Open the email and tap the confirmation link. Return to Loro afterward to finish
              creating your account and enter the app.
            </Text>
          </View>
          {notice ? <AuthMessage message={notice} tone="info" /> : null}
          {messages}
          <QuestActionButton
            disabled={!isConfigured}
            icon="refresh"
            label="Refresh verification status"
            loading={isSubmitting}
            mode="tap"
            onAction={() => run(refreshVerification)}
          />
          <Text className="text-center text-xs font-semibold leading-5 text-content-muted">
            When the confirmation link returns to Loro, you will be signed in automatically.
          </Text>
          <TextAction
            disabled={resendCooldown > 0}
            label="Didn't receive it? Send another email"
            onPress={resendEmail}
          />
          {resendCooldown > 0 ? (
            <Text className="text-center text-sm font-semibold text-content-subtle">
              Available in {formatCooldown(resendCooldown)}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  const renderSignUp = () => (
    <>
      <AuthHero variant="signup" onBack={() => setView("signIn")} />
      <View className="-mt-2 gap-4 rounded-t-3xl bg-surface-card px-5 pb-7 pt-7" style={shadows.card}>
        <View className="items-center">
          <Text className="text-center text-3xl font-black text-content">Create your adventurer</Text>
          <Text className="mt-1 text-center text-sm font-semibold text-content-muted">
            Set up your account, then choose your path.
          </Text>
        </View>
        <AvatarClassSelector
          gender={avatarGender}
          onClassChange={setAvatarClassId}
          onGenderChange={setAvatarGender}
          selectedClassId={avatarClassId}
        />
        <AuthField autoCapitalize="words" autoComplete="name" label="Display name" onChangeText={setDisplayName} placeholder="What should Lory call you?" value={displayName} />
        <AuthField autoComplete="email" keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} />
        <AuthField autoComplete="new-password" label="Password" onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry value={password} />
        <AuthField autoComplete="new-password" label="Confirm password" onChangeText={setConfirmPassword} placeholder="Repeat your password" secureTextEntry value={confirmPassword} />
        <View className="gap-2">
          <View className="flex-row gap-2">
            {[0, 4, 8].map((threshold) => (
              <View key={threshold} className={`h-1.5 flex-1 rounded-pill ${password.length > threshold ? "bg-success" : "bg-line-disabled"}`} />
            ))}
          </View>
          <Text className="text-center text-sm font-semibold text-content-muted">
            {password.length >= 8 ? "Trail-ready password" : "Use at least 8 characters"}
          </Text>
        </View>
        <Pressable className="flex-row items-start gap-3 py-1" accessibilityRole="checkbox" accessibilityState={{ checked: acceptedTerms }} onPress={() => setAcceptedTerms((current) => !current)}>
          <View className={`mt-px h-5 w-5 items-center justify-center rounded-card border ${acceptedTerms ? "border-primary-strong bg-primary" : "border-line-muted bg-surface-card"}`}>
            {acceptedTerms ? <Ionicons name="checkmark" size={14} color="white" /> : null}
          </View>
          <Text className="flex-1 text-sm font-semibold leading-5 text-content-muted">
            I agree to the <Text className="font-black text-primary-strong">Terms</Text> and <Text className="font-black text-primary-strong">Privacy Policy</Text>
          </Text>
        </Pressable>
        {messages}
        <QuestActionButton disabled={!displayName || !email || !password || !confirmPassword || !acceptedTerms || !isConfigured} icon="person-add" label="Create account" loading={isSubmitting} mode="tap" onAction={submitSignUp} />
        <Divider />
        <QuestActionButton icon="compass-outline" label="Continue as guest" loading={isSubmitting} mode="tap" onAction={() => run(continueAsGuest)} variant="secondary" />
        <TextAction label="Already have an account? Log in" onPress={() => setView("signIn")} />
      </View>
    </>
  );

  const renderForgotPassword = () => (
    <>
      <AuthHero variant="signup" onBack={() => setView("signIn")} />
      <View className="-mt-2 gap-4 rounded-t-3xl bg-surface-card px-5 pb-8 pt-7">
        <View className="items-center">
          <Text className="text-center text-3xl font-black text-content">Find your trail</Text>
          <Text className="mt-2 text-center text-sm font-semibold text-content-muted">
            We'll send a secure recovery link to your inbox.
          </Text>
        </View>
        <AuthField autoComplete="email" keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} />
        {messages}
        <QuestActionButton disabled={!email || !isConfigured} icon="paper-plane" label="Send recovery link" loading={isSubmitting} mode="tap" onAction={() => run(() => requestPasswordReset(email))} />
      </View>
    </>
  );

  const renderPasswordRecovery = () => (
    <>
      <AuthHero variant="verification" />
      <View className="-mt-2 gap-4 rounded-t-3xl bg-surface-card px-5 pb-8 pt-7">
        <View className="items-center">
          <Text className="text-center text-3xl font-black text-content">New password</Text>
          <Text className="mt-2 text-center text-sm font-semibold text-content-muted">
            Choose a fresh key for your adventure.
          </Text>
        </View>
        <AuthField autoComplete="new-password" label="New password" onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry value={password} />
        <AuthField autoComplete="new-password" label="Confirm password" onChangeText={setConfirmPassword} placeholder="Repeat your new password" secureTextEntry value={confirmPassword} />
        {messages}
        <QuestActionButton disabled={!password || !confirmPassword} icon="checkmark-circle" label="Save new password" loading={isSubmitting} mode="tap" onAction={submitPasswordUpdate} />
      </View>
    </>
  );

  const renderLogin = () => (
    <>
      <AuthHero variant="login" />
      <View className="-mt-2 gap-4 rounded-t-3xl bg-surface-card px-5 pb-8 pt-7">
        <View className="items-center">
          <Text className="text-center text-3xl font-black text-content">Welcome back, Adventurer!</Text>
          <Text className="mt-2 text-center text-sm font-semibold text-content-muted">
            Start helpful habits with Lory.
          </Text>
        </View>
        <AuthField autoComplete="email" keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} />
        <AuthField autoComplete="current-password" label="Password" onChangeText={setPassword} placeholder="Your password" secureTextEntry value={password} />
        <View className="items-end"><TextAction label="Forgot password?" onPress={() => setView("forgotPassword")} /></View>
        {messages}
        <QuestActionButton disabled={!email || !password || !isConfigured} icon="log-in" label="Log in" loading={isSubmitting} mode="tap" onAction={() => run(() => signIn(email, password))} />
        <Divider />
        <QuestActionButton icon="compass-outline" label="Continue as guest" loading={isSubmitting} mode="tap" onAction={() => run(continueAsGuest)} variant="secondary" />
        <Text className="text-center text-xs font-semibold text-content-muted">
          Guest progress stays on this device.
        </Text>
        <TextAction label="New to Loro? Create account" onPress={() => setView("signUp")} />
      </View>
    </>
  );

  const renderContent = () => {
    if (status === "awaitingVerification") return renderVerification();
    if (status === "passwordRecovery") return renderPasswordRecovery();
    if (view === "signUp") return renderSignUp();
    if (view === "forgotPassword") return renderForgotPassword();
    return renderLogin();
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas-sky">
      <StatusBar style="dark" />
      <LinearGradient colors={[colors.sky, colors.mint, colors.cream]} className="flex-1">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerClassName="flex-grow"
            contentContainerStyle={{ alignItems: "center" }}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ width: authWidth }}>{renderContent()}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
