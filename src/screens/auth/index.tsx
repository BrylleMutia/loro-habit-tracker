import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useState, type ComponentProps } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../constants/colors";
import { images } from "../../constants/images";
import { useAuth } from "../../contexts/authContext";
import { shadows } from "../../styles/shadows";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function AuthField({
  autoCapitalize = "none",
  autoComplete,
  icon,
  label,
  onChangeText,
  placeholder,
  secureTextEntry,
  value
}: {
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: ComponentProps<typeof TextInput>["autoComplete"];
  icon: IoniconName;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
}) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View className="mt-4">
      <Text className="mb-2 text-xs font-extrabold uppercase text-content-muted">{label}</Text>
      <View className="h-13 flex-row items-center rounded-card border border-line-blue bg-surface-card px-3">
        <Ionicons name={icon} size={19} color={colors.blueDark} />
        <TextInput
          className="ml-3 flex-1 text-base font-semibold text-content"
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          accessibilityLabel={label}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.tabInactive}
          secureTextEntry={isPassword && !passwordVisible}
          value={value}
        />
        {isPassword ? (
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center"
            accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
            accessibilityRole="button"
            onPress={() => setPasswordVisible((current) => !current)}
          >
            <Ionicons
              name={passwordVisible ? "eye-off-outline" : "eye-outline"}
              size={19}
              color={colors.grayIcon}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function AuthButton({
  disabled,
  icon,
  label,
  loading,
  onPress,
  secondary = false
}: {
  disabled?: boolean;
  icon: IoniconName;
  label: string;
  loading?: boolean;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <TouchableOpacity
      className={`mt-5 h-13 flex-row items-center justify-center rounded-card border ${
        secondary
          ? "border-line-primary bg-surface-card"
          : "border-primary-strong bg-primary"
      } ${disabled ? "opacity-50" : ""}`}
      style={shadows.card}
      activeOpacity={0.82}
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.blueDark : colors.card} />
      ) : (
        <>
          <Ionicons name={icon} size={19} color={secondary ? colors.blueDark : colors.card} />
          <Text
            className={`ml-2 text-sm font-black ${secondary ? "text-primary-strong" : "text-white"}`}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function AuthMessage({ message, tone = "error" }: { message: string; tone?: "error" | "info" }) {
  return (
    <View
      className={`mt-4 flex-row rounded-card border p-3 ${
        tone === "error"
          ? "border-line-red bg-surface-red"
          : "border-line-blue bg-primary-soft"
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

export function AuthScreen() {
  const {
    awaitingAction,
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
    view
  } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    run(() => signUp(displayName, email, password));
  };

  const submitPasswordUpdate = () => {
    if (password.length < 8) {
      setLocalError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Those passwords do not match yet.");
      return;
    }
    run(() => updatePassword(password));
  };

  const renderForm = () => {
    if (status === "awaitingVerification") {
      const isPasswordReset = awaitingAction === "passwordReset";
      return (
        <>
          <View className="mt-2 items-center">
            <View className="h-16 w-16 items-center justify-center rounded-pill bg-primary-soft">
              <Ionicons
                name={isPasswordReset ? "key-outline" : "mail-unread-outline"}
                size={30}
                color={colors.blueDark}
              />
            </View>
            <Text className="mt-4 text-center text-2xl font-black text-content">
              {isPasswordReset ? "Check your inbox" : "Verify your email"}
            </Text>
            <Text className="mt-2 text-center text-sm font-semibold leading-6 text-content-muted">
              {isPasswordReset
                ? "Open the password reset link we sent to continue."
                : "One quick email check, then your first trail will be ready."}
            </Text>
            {pendingEmail ? (
              <Text className="mt-2 text-center text-sm font-black text-primary-strong">
                {pendingEmail}
              </Text>
            ) : null}
          </View>
          {notice ? <AuthMessage message={notice} tone="info" /> : null}
          {errorMessage ? <AuthMessage message={errorMessage} /> : null}
          {!isPasswordReset ? (
            <AuthButton
              icon="refresh-outline"
              label="Resend verification email"
              loading={isSubmitting}
              onPress={() => {
                run(async () => {
                  await resendVerification();
                  setNotice("A fresh verification email is on its way.");
                });
              }}
            />
          ) : null}
          <AuthButton
            icon="arrow-back-outline"
            label="Back to sign in"
            onPress={returnToSignIn}
            secondary
          />
        </>
      );
    }

    if (status === "passwordRecovery") {
      return (
        <>
          <Text className="text-2xl font-black text-content">Choose a new password</Text>
          <Text className="mt-2 text-sm font-semibold leading-5 text-content-muted">
            Make it memorable and at least 8 characters long.
          </Text>
          <AuthField
            autoComplete="new-password"
            icon="lock-closed-outline"
            label="New password"
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            value={password}
          />
          <AuthField
            autoComplete="new-password"
            icon="shield-checkmark-outline"
            label="Confirm password"
            onChangeText={setConfirmPassword}
            placeholder="Repeat your new password"
            secureTextEntry
            value={confirmPassword}
          />
          {localError || errorMessage ? <AuthMessage message={localError ?? errorMessage ?? ""} /> : null}
          <AuthButton
            disabled={!password || !confirmPassword}
            icon="checkmark-circle-outline"
            label="Save new password"
            loading={isSubmitting}
            onPress={submitPasswordUpdate}
          />
        </>
      );
    }

    if (view === "signUp") {
      return (
        <>
          <Text className="text-2xl font-black text-content">Create your adventurer</Text>
          <Text className="mt-2 text-sm font-semibold leading-5 text-content-muted">
            Your progress will follow you securely across devices.
          </Text>
          <AuthField
            autoCapitalize="words"
            autoComplete="name"
            icon="person-outline"
            label="Display name"
            onChangeText={setDisplayName}
            placeholder="What should Lory call you?"
            value={displayName}
          />
          <AuthField
            autoComplete="email"
            icon="mail-outline"
            label="Email"
            onChangeText={setEmail}
            placeholder="you@example.com"
            value={email}
          />
          <AuthField
            autoComplete="new-password"
            icon="lock-closed-outline"
            label="Password"
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            value={password}
          />
          <AuthField
            autoComplete="new-password"
            icon="shield-checkmark-outline"
            label="Confirm password"
            onChangeText={setConfirmPassword}
            placeholder="Repeat your password"
            secureTextEntry
            value={confirmPassword}
          />
          {localError || errorMessage ? <AuthMessage message={localError ?? errorMessage ?? ""} /> : null}
          <AuthButton
            disabled={!displayName || !email || !password || !confirmPassword || !isConfigured}
            icon="map-outline"
            label="Begin my adventure"
            loading={isSubmitting}
            onPress={submitSignUp}
          />
          <TouchableOpacity
            className="mt-5 items-center py-2"
            accessibilityRole="button"
            onPress={() => setView("signIn")}
          >
            <Text className="text-sm font-bold text-content-muted">
              Already exploring? <Text className="font-black text-primary-strong">Sign in</Text>
            </Text>
          </TouchableOpacity>
        </>
      );
    }

    if (view === "forgotPassword") {
      return (
        <>
          <Text className="text-2xl font-black text-content">Reset your password</Text>
          <Text className="mt-2 text-sm font-semibold leading-5 text-content-muted">
            We’ll send a secure recovery link to your email.
          </Text>
          <AuthField
            autoComplete="email"
            icon="mail-outline"
            label="Email"
            onChangeText={setEmail}
            placeholder="you@example.com"
            value={email}
          />
          {errorMessage ? <AuthMessage message={errorMessage} /> : null}
          <AuthButton
            disabled={!email || !isConfigured}
            icon="paper-plane-outline"
            label="Send recovery link"
            loading={isSubmitting}
            onPress={() => run(() => requestPasswordReset(email))}
          />
          <AuthButton
            icon="arrow-back-outline"
            label="Back to sign in"
            onPress={() => setView("signIn")}
            secondary
          />
        </>
      );
    }

    return (
      <>
        <Text className="text-2xl font-black text-content">Welcome back</Text>
        <Text className="mt-2 text-sm font-semibold leading-5 text-content-muted">
          Lory kept your place on the trail.
        </Text>
        <AuthField
          autoComplete="email"
          icon="mail-outline"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          value={email}
        />
        <AuthField
          autoComplete="current-password"
          icon="lock-closed-outline"
          label="Password"
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          value={password}
        />
        <TouchableOpacity
          className="mt-3 self-end py-1"
          accessibilityRole="button"
          onPress={() => setView("forgotPassword")}
        >
          <Text className="text-xs font-black text-primary-strong">Forgot password?</Text>
        </TouchableOpacity>
        {errorMessage ? <AuthMessage message={errorMessage} /> : null}
        <AuthButton
          disabled={!email || !password || !isConfigured}
          icon="log-in-outline"
          label="Continue adventure"
          loading={isSubmitting}
          onPress={() => run(() => signIn(email, password))}
        />
        <TouchableOpacity
          className="mt-5 items-center py-2"
          accessibilityRole="button"
          onPress={() => setView("signUp")}
        >
          <Text className="text-sm font-bold text-content-muted">
            New to Loro? <Text className="font-black text-primary-strong">Create an account</Text>
          </Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas-sky">
      <StatusBar style="dark" />
      <LinearGradient colors={[colors.sky, colors.mint, colors.cream]} className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerClassName="flex-grow justify-center px-5 py-8"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center">
              <View className="h-24 w-24 items-center justify-center rounded-pill border-2 border-line-blue-strong bg-surface-card">
                <Image
                  style={{ height: 80, width: 80 }}
                  source={images.parrotMascot}
                  resizeMode="contain"
                  accessibilityLabel="Lory the Trail Captain"
                  accessibilityRole="image"
                />
              </View>
              <Text className="mt-3 font-display text-3xl font-black text-content">Loro</Text>
              <Text className="mt-1 text-xs font-extrabold uppercase tracking-widest text-content-blue-muted">
                Small habits. Big adventure.
              </Text>
            </View>

            <View
              className="mt-6 rounded-card border border-line-blue bg-surface-card p-5"
              style={shadows.card}
            >
              {!isConfigured ? (
                <AuthMessage
                  message="Supabase is ready in the code, but this build needs EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env. Restart Expo after adding them."
                  tone="info"
                />
              ) : null}
              {renderForm()}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
