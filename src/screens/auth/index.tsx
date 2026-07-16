import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthField } from "../../components/AuthField";
import { QuestActionButton } from "../../components/QuestActionButton";
import { VerificationCodeInput } from "../../components/VerificationCodeInput";
import { colors } from "../../constants/colors";
import { images } from "../../constants/images";
import { useAuth } from "../../contexts/authContext";
import { useScreenContentWidth } from "../../hooks/useScreenContentWidth";
import { shadows } from "../../styles/shadows";

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

function TextAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      className="min-h-10 items-center justify-center px-2"
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
    >
      <Text className="text-sm font-black text-primary-strong">{label}</Text>
    </Pressable>
  );
}

function AuthHero({ compact = false, subtitle, title }: { compact?: boolean; subtitle: string; title: string }) {
  return (
    <ImageBackground
      className={`overflow-hidden rounded-card border border-line-hero ${compact ? "h-44" : "h-52"}`}
      source={images.headerBackground}
      imageStyle={{ resizeMode: "cover" }}
      style={shadows.card}
    >
      <LinearGradient
        colors={["rgba(223,245,255,0.98)", "rgba(223,245,255,0.65)", "rgba(223,245,255,0.08)"]}
        className="absolute inset-0"
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
      <View className="flex-1 justify-center px-5 pr-32">
        <View className="mb-2 h-9 w-9 items-center justify-center rounded-card border border-line-blue bg-surface-card">
          <Ionicons name="map" size={19} color={colors.blueDark} />
        </View>
        <Text className={`${compact ? "text-2xl" : "text-3xl"} font-black text-content`}>{title}</Text>
        <Text className="mt-2 text-sm font-bold leading-5 text-content-muted">{subtitle}</Text>
      </View>
      <Image
        className={`absolute bottom-0 right-3 ${compact ? "h-28 w-28" : "h-36 w-36"}`}
        source={images.parrotMascot}
        resizeMode="contain"
        accessibilityLabel="Lory the Trail Captain"
        accessibilityRole="image"
      />
    </ImageBackground>
  );
}

export function AuthScreen() {
  const contentWidth = useScreenContentWidth();
  const {
    awaitingAction,
    continueAsGuest,
    errorMessage,
    isConfigured,
    isSubmitting,
    pendingEmail,
    requestPasswordReset,
    resendVerification,
    returnToSignIn,
    setView,
    signIn,
    signUp,
    status,
    updatePassword,
    verifyEmailCode,
    view
  } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    run(() => signUp(displayName, email, password));
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

  const sharedMessages = (
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

  const renderVerification = () => {
    const isPasswordReset = awaitingAction === "passwordReset";
    if (isPasswordReset) {
      return (
        <View className="gap-4">
          <AuthHero compact title="Check your inbox" subtitle="Lory sent a secure password reset link." />
          <View className="gap-4 rounded-card border border-line bg-surface-card p-5" style={shadows.card}>
            <View className="items-center gap-2">
              <View className="h-14 w-14 items-center justify-center rounded-pill bg-primary-soft">
                <Ionicons name="mail-unread-outline" size={27} color={colors.blueDark} />
              </View>
              <Text className="text-center text-2xl font-black text-content">Open the recovery link</Text>
              <Text className="text-center text-sm font-semibold leading-5 text-content-muted">
                We sent it to {pendingEmail ?? "your email"}. Return here after choosing a new password.
              </Text>
            </View>
            {sharedMessages}
            <QuestActionButton icon="arrow-back" label="Back to sign in" mode="tap" onAction={returnToSignIn} variant="secondary" />
          </View>
        </View>
      );
    }

    return (
      <View className="gap-4">
        <AuthHero compact title="Verification" subtitle="One quick checkpoint before your trail begins." />
        <View className="gap-4 rounded-card border border-line bg-surface-card p-5" style={shadows.card}>
          <View className="relative flex-row items-start justify-center">
            <View className="absolute left-12 right-12 top-3.5 h-px bg-line-blue-accent" />
            {["Account", "Verify", "Ready"].map((step, index) => (
              <View key={step} className="flex-1 items-center gap-1.5">
                <View className={`h-7 w-7 items-center justify-center rounded-pill border ${index < 2 ? "border-primary-strong bg-primary" : "border-line bg-surface-muted"}`}>
                  <Text className={`text-xs font-black ${index < 2 ? "text-white" : "text-content-subtle"}`}>{index + 1}</Text>
                </View>
                <Text className={`text-micro font-extrabold ${index < 2 ? "text-primary-strong" : "text-content-subtle"}`}>{step}</Text>
              </View>
            ))}
          </View>
          <View className="items-center gap-2">
            <Text className="text-center text-2xl font-black text-content">Check your inbox</Text>
            <Text className="text-center text-sm font-semibold leading-5 text-content-muted">
              Enter the six-digit code sent to {pendingEmail ?? "your email"}, or use the confirmation link.
            </Text>
          </View>
          <VerificationCodeInput code={verificationCode} onChangeCode={setVerificationCode} />
          {notice ? <AuthMessage message={notice} tone="info" /> : null}
          {sharedMessages}
          <QuestActionButton
            disabled={verificationCode.length !== 6 || !isConfigured}
            icon="shield-checkmark"
            label="Verify code"
            loading={isSubmitting}
            mode="tap"
            onAction={() => run(() => verifyEmailCode(verificationCode))}
          />
          <TextAction
            label="Resend verification email"
            onPress={() => run(async () => {
              await resendVerification();
              setNotice("A fresh verification email is on its way.");
            })}
          />
          <TextAction label="Back to sign in" onPress={returnToSignIn} />
        </View>
      </View>
    );
  };

  const renderForm = () => {
    if (status === "awaitingVerification") return renderVerification();

    if (status === "passwordRecovery") {
      return (
        <View className="gap-4">
          <AuthHero compact title="New password" subtitle="Choose a fresh key for your adventure." />
          <View className="gap-4 rounded-card border border-line bg-surface-card p-5" style={shadows.card}>
            <Text className="text-2xl font-black text-content">Secure your account</Text>
            <AuthField autoComplete="new-password" icon="lock-closed-outline" label="New password" onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry value={password} />
            <AuthField autoComplete="new-password" icon="shield-checkmark-outline" label="Confirm password" onChangeText={setConfirmPassword} placeholder="Repeat your new password" secureTextEntry value={confirmPassword} />
            {sharedMessages}
            <QuestActionButton disabled={!password || !confirmPassword} icon="checkmark-circle" label="Save new password" loading={isSubmitting} mode="tap" onAction={submitPasswordUpdate} />
          </View>
        </View>
      );
    }

    if (view === "signUp") {
      return (
        <View className="gap-4">
          <AuthHero compact title="Create your adventurer" subtitle="Your first Daily Quest starts here." />
          <View className="gap-4 rounded-card border border-line bg-surface-card p-5" style={shadows.card}>
            <View>
              <Text className="text-2xl font-black text-content">Join Lory's trail</Text>
              <Text className="mt-1 text-sm font-semibold leading-5 text-content-muted">Save progress and continue across devices.</Text>
            </View>
            <AuthField autoCapitalize="words" autoComplete="name" icon="person-outline" label="Display name" onChangeText={setDisplayName} placeholder="What should Lory call you?" value={displayName} />
            <AuthField autoComplete="email" icon="mail-outline" keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} />
            <AuthField autoComplete="new-password" icon="lock-closed-outline" label="Password" onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry value={password} />
            <View className="h-1 overflow-hidden rounded-pill bg-line-progress"><View className={`h-full ${password.length >= 8 ? "w-full bg-success" : password.length >= 4 ? "w-1/2 bg-reward" : "w-1/4 bg-line-muted"}`} /></View>
            <AuthField autoComplete="new-password" icon="shield-checkmark-outline" label="Confirm password" onChangeText={setConfirmPassword} placeholder="Repeat your password" secureTextEntry value={confirmPassword} />
            <Pressable className="flex-row items-start gap-3 py-1" accessibilityRole="checkbox" accessibilityState={{ checked: acceptedTerms }} onPress={() => setAcceptedTerms((current) => !current)}>
              <View className={`mt-px h-5 w-5 items-center justify-center rounded-card border ${acceptedTerms ? "border-primary-strong bg-primary" : "border-line-muted bg-surface-card"}`}>
                {acceptedTerms ? <Ionicons name="checkmark" size={14} color="white" /> : null}
              </View>
              <Text className="flex-1 text-xs font-semibold leading-5 text-content-muted">I agree to the Terms and Privacy Policy.</Text>
            </Pressable>
            {sharedMessages}
            <QuestActionButton disabled={!displayName || !email || !password || !confirmPassword || !acceptedTerms || !isConfigured} icon="map" label="Create account" loading={isSubmitting} mode="tap" onAction={submitSignUp} />
            <QuestActionButton icon="compass-outline" label="Continue as guest" loading={isSubmitting} mode="tap" onAction={() => run(continueAsGuest)} variant="secondary" />
            <TextAction label="Already exploring? Sign in" onPress={() => setView("signIn")} />
          </View>
        </View>
      );
    }

    if (view === "forgotPassword") {
      return (
        <View className="gap-4">
          <AuthHero compact title="Find your trail" subtitle="We'll send a secure recovery link." />
          <View className="gap-4 rounded-card border border-line bg-surface-card p-5" style={shadows.card}>
            <Text className="text-2xl font-black text-content">Reset your password</Text>
            <AuthField autoComplete="email" icon="mail-outline" keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} />
            {sharedMessages}
            <QuestActionButton disabled={!email || !isConfigured} icon="paper-plane" label="Send recovery link" loading={isSubmitting} mode="tap" onAction={() => run(() => requestPasswordReset(email))} />
            <QuestActionButton icon="arrow-back" label="Back to sign in" mode="tap" onAction={() => setView("signIn")} variant="secondary" />
          </View>
        </View>
      );
    }

    return (
      <View className="gap-4">
        <AuthHero title="Welcome back" subtitle="Lory kept your place on the trail." />
        <View className="gap-4 rounded-card border border-line bg-surface-card p-5" style={shadows.card}>
          <View>
            <Text className="text-2xl font-black text-content">Continue your adventure</Text>
            <Text className="mt-1 text-sm font-semibold leading-5 text-content-muted">Log in to sync quests, rewards, and streaks.</Text>
          </View>
          <AuthField autoComplete="email" icon="mail-outline" keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} />
          <AuthField autoComplete="current-password" icon="lock-closed-outline" label="Password" onChangeText={setPassword} placeholder="Your password" secureTextEntry value={password} />
          <View className="items-end"><TextAction label="Forgot password?" onPress={() => setView("forgotPassword")} /></View>
          {sharedMessages}
          <QuestActionButton disabled={!email || !password || !isConfigured} icon="log-in" label="Log in" loading={isSubmitting} mode="tap" onAction={() => run(() => signIn(email, password))} />
          <View className="flex-row items-center gap-3"><View className="h-px flex-1 bg-line" /><Text className="text-xs font-bold text-content-subtle">OR</Text><View className="h-px flex-1 bg-line" /></View>
          <QuestActionButton icon="compass-outline" label="Continue as guest" loading={isSubmitting} mode="tap" onAction={() => run(continueAsGuest)} variant="secondary" />
          <Text className="text-center text-xs font-semibold leading-5 text-content-muted">Guest progress stays on this device until you sign in.</Text>
          <TextAction label="New to Loro? Create an account" onPress={() => setView("signUp")} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas-sky">
      <StatusBar style="dark" />
      <LinearGradient colors={[colors.sky, colors.mint, colors.cream]} className="flex-1">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerClassName="flex-grow py-5"
            contentContainerStyle={{ alignItems: "center" }}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-4" style={{ width: contentWidth }}>
              {renderForm()}
              <Text className="pb-2 text-center text-xs font-bold text-content-blue-muted">LORO HABIT TRACKER</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
