import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

import {
  AuthCallbackError,
  createSessionFromAuthUrl,
  getAuthCallbackKey,
  getAuthRedirectUrl,
  getGoogleAuthRedirectUrl,
  isAuthCallbackUrl
} from "../../services/authLinks";
import {
  clearGoogleLinkIntent,
  readGoogleLinkIntent,
  writeGoogleLinkIntent
} from "../../services/authLinkIntent";
import { clearCachedGameState } from "../../services/gameCache";
import { completeOnboardingImport } from "../../services/onboardingImport";
import {
  clearOnboardingSession,
  readOnboardingSession,
  writeOnboardingSession
} from "../../services/onboardingSession";
import { writeOnboardingCompleted } from "../../services/onboardingSession";
import {
  readGuestSessionEnabled,
  writeGuestSessionEnabled
} from "../../services/guestSession";
import { isSupabaseConfigured, supabase } from "../../services/supabaseClient";
import { createOnboardingImportId, isOnboardingImportId } from "../../utility/onboarding";
import type { AuthStatus, AuthView, AwaitingAuthAction } from "../../types/backend";
import type { AvatarClassId, AvatarVariant } from "../../types/app";

type AuthContextValue = {
  status: AuthStatus;
  view: AuthView;
  session: Session | null;
  user: User | null;
  pendingEmail: string | null;
  awaitingAction: AwaitingAuthAction | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  isConfigured: boolean;
  isGuest: boolean;
  googleLinkPending: boolean;
  setView: (view: AuthView) => void;
  cancelGoogleLinkRecovery: () => void;
  clearError: () => void;
  continueAsGuest: () => Promise<void>;
  signUp: (
    displayName: string,
    email: string,
    password: string,
    avatarClassId: AvatarClassId,
    avatarVariant: AvatarVariant
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  linkGoogleIdentity: () => Promise<void>;
  continueWithEmailSession: () => Promise<void>;
  refreshVerification: () => Promise<void>;
  resendVerification: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  returnToSignIn: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getDeviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Lory could not finish that request. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("booting");
  const [view, setAuthView] = useState<AuthView>("signIn");
  const [session, setSession] = useState<Session | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [awaitingAction, setAwaitingAction] = useState<AwaitingAuthAction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLinkPending, setGoogleLinkPending] = useState(false);
  // This is intentionally memory-only and is cleared as soon as signup is confirmed or abandoned.
  const pendingPasswordRef = useRef<string | null>(null);
  const onboardingImportInFlightRef = useRef(false);
  const authInitializationCompleteRef = useRef(false);
  const authCallbackInFlightRef = useRef<string | null>(null);
  const authCallbackFailureRef = useRef(false);
  const processedAuthCallbacksRef = useRef(new Set<string>());
  const googleLinkPendingRef = useRef(false);

  const completeStoredOnboardingImport = useCallback(async () => {
    let onboardingSession = await readOnboardingSession();
    if (!onboardingSession || onboardingSession.phase !== "completed") return null;

    // Older clients generated a timestamp-based import ID when native crypto
    // was unavailable. The RPC column is uuid, so re-key that still-pending
    // local payload before the first server attempt.
    if (!isOnboardingImportId(onboardingSession.importId)) {
      onboardingSession = {
        ...onboardingSession,
        importId: createOnboardingImportId(),
        updatedAt: new Date().toISOString()
      };
      await writeOnboardingSession(onboardingSession);
    }

    const outcome = await completeOnboardingImport(onboardingSession);
    await writeOnboardingCompleted(true);
    if (onboardingSession.source === "guest-migration") {
      await clearCachedGameState("local-guest");
    }
    await clearOnboardingSession();
    return outcome;
  }, []);

  const cancelGoogleLinkRecovery = useCallback(() => {
    void clearGoogleLinkIntent();
    googleLinkPendingRef.current = false;
    setGoogleLinkPending(false);
  }, []);

  const setView = useCallback((nextView: AuthView) => {
    if (nextView !== "signIn") cancelGoogleLinkRecovery();
    setErrorMessage(null);
    setAuthView(nextView);
  }, [cancelGoogleLinkRecovery]);

  const resetAfterAuthCallbackFailure = useCallback(async () => {
    // A browser callback can arrive while an older local Supabase session is
    // still being restored. Keep later auth events from promoting that stale
    // session back to signedIn after this callback has failed.
    authCallbackFailureRef.current = true;
    onboardingImportInFlightRef.current = false;
    if (isSupabaseConfigured) {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    }
    setSession(null);
    setStatus("signedOut");
  }, []);

  const showGoogleLinkFailure = useCallback(async (message: string) => {
    await clearGoogleLinkIntent();
    googleLinkPendingRef.current = false;
    setGoogleLinkPending(false);
    // Keep the authenticated email session available while the user decides
    // whether to continue with email or retry the Google connection.
    onboardingImportInFlightRef.current = true;
    setStatus("linkingIdentity");
    setErrorMessage(message);
  }, []);

  const handleAuthUrl = useCallback(async (url: string) => {
    if (!isSupabaseConfigured) return;
    if (!isAuthCallbackUrl(url)) return;

    const linkIntent = await readGoogleLinkIntent();

    const callbackKey = getAuthCallbackKey(url);
    if (
      callbackKey &&
      (callbackKey === authCallbackInFlightRef.current ||
        processedAuthCallbacksRef.current.has(callbackKey))
    ) {
      return;
    }

    authCallbackInFlightRef.current = callbackKey;

    try {
      setErrorMessage(null);
      // Session creation emits SIGNED_IN before the awaited auth call returns.
      // Keep RootGate closed until the onboarding import has committed.
      onboardingImportInFlightRef.current = true;
      const result = await createSessionFromAuthUrl(url);
      if (!result.handled) {
        onboardingImportInFlightRef.current = false;
        return;
      }

      if (result.callbackKey) {
        processedAuthCallbacksRef.current.add(result.callbackKey);
        if (processedAuthCallbacksRef.current.size > 20) {
          const oldestKey = processedAuthCallbacksRef.current.values().next().value;
          if (oldestKey) processedAuthCallbacksRef.current.delete(oldestKey);
        }
      }

      if (result.cancelled) {
        if (linkIntent) {
          await showGoogleLinkFailure(
            "Google connection was canceled. You are still signed in with email."
          );
        } else {
          await resetAfterAuthCallbackFailure();
        }
      } else if (result.isRecovery) {
        onboardingImportInFlightRef.current = false;
        setStatus("passwordRecovery");
      } else if (linkIntent) {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) throw new Error("Your email session could not be restored.");

        const { data: identityData, error: identityError } =
          await supabase.auth.getUserIdentities();
        if (identityError) throw identityError;
        if (!identityData.identities.some((identity) => identity.provider === "google")) {
          throw new Error("Google was not connected to this Loro account.");
        }

        await clearGoogleLinkIntent();
        await completeStoredOnboardingImport();
        await writeGuestSessionEnabled(false);
        googleLinkPendingRef.current = false;
        setGoogleLinkPending(false);
        pendingPasswordRef.current = null;
        setSession(data.session);
        setPendingEmail(null);
        setAwaitingAction(null);
        setStatus("signedIn");
        onboardingImportInFlightRef.current = false;
      } else {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) throw new Error("The verification link did not create a session.");
        await completeStoredOnboardingImport();
        await writeGuestSessionEnabled(false);
        pendingPasswordRef.current = null;
        setSession(data.session);
        setPendingEmail(null);
        setAwaitingAction(null);
        setStatus("signedIn");
        onboardingImportInFlightRef.current = false;
      }
    } catch (error) {
      if (linkIntent) {
        await showGoogleLinkFailure(
          "Google could not be connected. Continue with email or try connecting Google again."
        );
      } else {
        await resetAfterAuthCallbackFailure();
        if (error instanceof AuthCallbackError && error.code === "identity_already_exists") {
          googleLinkPendingRef.current = true;
          setGoogleLinkPending(true);
          setAuthView("signIn");
        }
        setErrorMessage(getAuthErrorMessage(error));
      }
    } finally {
      if (authCallbackInFlightRef.current === callbackKey) {
        authCallbackInFlightRef.current = null;
      }
    }
  }, [
    completeStoredOnboardingImport,
    resetAfterAuthCallbackFailure,
    showGoogleLinkFailure
  ]);

  useEffect(() => {
    let isMounted = true;
    let removeAuthListener: (() => void) | null = null;
    const linkListener = Linking.addEventListener("url", ({ url }) => {
      void handleAuthUrl(url);
    });

    if (isSupabaseConfigured) {
      // Supabase can emit INITIAL_SESSION as soon as this listener is
      // registered. Initialization below is responsible for completing any
      // persisted onboarding import before it exposes signed-in app state.
      onboardingImportInFlightRef.current = true;
      const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (!isMounted) return;

        if (authCallbackFailureRef.current) {
          setSession(null);
          if (!nextSession) setStatus("signedOut");
          return;
        }

        setSession(nextSession);

        // INITIAL_SESSION can arrive before the awaited getSession() call
        // finishes reading native storage. Keep RootGate in its booting state
        // until that authoritative initialization path chooses the status.
        if (!authInitializationCompleteRef.current) return;

        if (event === "PASSWORD_RECOVERY") {
          setStatus("passwordRecovery");
        } else if (nextSession) {
          pendingPasswordRef.current = null;
          void writeGuestSessionEnabled(false);
          if (!onboardingImportInFlightRef.current) {
            setStatus((current) => (current === "passwordRecovery" ? current : "signedIn"));
          }
        } else {
          setStatus((current) =>
            current === "awaitingVerification" || current === "guest" ? current : "signedOut"
          );
        }
      });
      removeAuthListener = () => data.subscription.unsubscribe();
    }

    void (async () => {
      try {
        const guestEnabled = await readGuestSessionEnabled();
        if (!isSupabaseConfigured) {
          if (isMounted) {
            authInitializationCompleteRef.current = true;
            setStatus(guestEnabled ? "guest" : "signedOut");
          }
          return;
        }

        const [sessionResult, initialUrl] = await Promise.all([
          supabase.auth.getSession(),
          Linking.getInitialURL()
        ]);
        if (!isMounted) return;
        if (sessionResult.error) throw sessionResult.error;

        const nextSession = sessionResult.data.session;

        // Process a callback before exposing a restored session. If the
        // provider rejected the OAuth attempt, an older cached session must
        // not mount the game screen and mask the auth error.
        if (initialUrl && isAuthCallbackUrl(initialUrl)) {
          authInitializationCompleteRef.current = true;
          onboardingImportInFlightRef.current = true;
          await handleAuthUrl(initialUrl);
          return;
        }

        setSession(nextSession);
        if (nextSession) {
          await completeStoredOnboardingImport();
          pendingPasswordRef.current = null;
          await writeGuestSessionEnabled(false);
          setStatus("signedIn");
          onboardingImportInFlightRef.current = false;
        } else {
          onboardingImportInFlightRef.current = false;
          setStatus(guestEnabled ? "guest" : "signedOut");
        }
        if (!initialUrl) await clearGoogleLinkIntent();
        authInitializationCompleteRef.current = true;
        if (initialUrl) void handleAuthUrl(initialUrl);
      } catch (error) {
        if (!isMounted) return;
        authInitializationCompleteRef.current = true;
        onboardingImportInFlightRef.current = false;
        setStatus("signedOut");
        setErrorMessage(getAuthErrorMessage(error));
      }
    })();

    return () => {
      isMounted = false;
      removeAuthListener?.();
      linkListener.remove();
    };
  }, [completeStoredOnboardingImport, handleAuthUrl]);

  const runAuthRequest = useCallback(async (request: () => Promise<void>) => {
    authCallbackFailureRef.current = false;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await request();
    } catch (error) {
      onboardingImportInFlightRef.current = false;
      setErrorMessage(getAuthErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const startGoogleIdentityLink = useCallback(async () => {
    if (!isSupabaseConfigured) {
      await showGoogleLinkFailure("Account linking needs the Supabase environment values.");
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      await showGoogleLinkFailure("Your email session could not be restored. Please sign in again.");
      return;
    }
    if (!sessionData.session) {
      await showGoogleLinkFailure("Sign in with email before connecting Google.");
      return;
    }

    const redirectTo = getGoogleAuthRedirectUrl();
    await writeGoogleLinkIntent();
    const { data, error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: Platform.OS !== "web"
      }
    });
    if (error || !data.url) {
      await showGoogleLinkFailure(
        "Google could not be connected. Enable account linking in Supabase or try again."
      );
      return;
    }

    if (Platform.OS === "web") return;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === "success") {
      await handleAuthUrl(result.url);
      return;
    }

    if (result.type === "cancel" || result.type === "dismiss") {
      await showGoogleLinkFailure(
        "Google connection was canceled. You are still signed in with email."
      );
      return;
    }

    await showGoogleLinkFailure(
      "Google could not be connected. Continue with email or try again."
    );
  }, [handleAuthUrl, showGoogleLinkFailure]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      view,
      session,
      user: session?.user ?? null,
      pendingEmail,
      awaitingAction,
      errorMessage,
      handleAuthUrl,
      isSubmitting,
      isConfigured: isSupabaseConfigured,
      isGuest: status === "guest",
      googleLinkPending,
      setView,
      cancelGoogleLinkRecovery,
      clearError: () => setErrorMessage(null),
      continueAsGuest: () =>
        runAuthRequest(async () => {
          pendingPasswordRef.current = null;
          await writeGuestSessionEnabled(true);
          setSession(null);
          setAwaitingAction(null);
          setStatus("guest");
        }),
      signUp: (displayName, email, password, avatarClassId, avatarVariant) =>
        runAuthRequest(async () => {
          if (!isSupabaseConfigured) throw new Error("Supabase is not configured yet.");
          const normalizedName = displayName.trim();
          const normalizedEmail = email.trim().toLowerCase();
          if (!normalizedName) throw new Error("Enter the name Lory should call you.");

          onboardingImportInFlightRef.current = true;
          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: getAuthRedirectUrl(),
              data: {
                avatar_class_id: avatarClassId,
                avatar_variant: avatarVariant,
                display_name: normalizedName,
                time_zone: getDeviceTimeZone()
              }
            }
          });
          if (error) throw error;

          if (data.session) {
            onboardingImportInFlightRef.current = true;
            await completeStoredOnboardingImport();
            pendingPasswordRef.current = null;
            await writeGuestSessionEnabled(false);
            setSession(data.session);
            setStatus("signedIn");
            onboardingImportInFlightRef.current = false;
          } else {
            onboardingImportInFlightRef.current = false;
            pendingPasswordRef.current = password;
            setPendingEmail(normalizedEmail);
            setAwaitingAction("verification");
            setStatus("awaitingVerification");
          }
        }),
      signIn: (email, password) =>
        runAuthRequest(async () => {
          if (!isSupabaseConfigured) throw new Error("Supabase is not configured yet.");
          const shouldLinkGoogle = googleLinkPendingRef.current;
          if (shouldLinkGoogle) onboardingImportInFlightRef.current = true;
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password
          });
          if (error) throw error;
          pendingPasswordRef.current = null;
          await writeGuestSessionEnabled(false);
          setSession(data.session);
          if (shouldLinkGoogle) {
            setStatus("linkingIdentity");
            await startGoogleIdentityLink();
            return;
          }
          setStatus("signedIn");
        }),
      signInWithGoogle: () =>
        runAuthRequest(async () => {
          if (!isSupabaseConfigured) throw new Error("Supabase is not configured yet.");

          const redirectTo = getGoogleAuthRedirectUrl();
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo,
              skipBrowserRedirect: Platform.OS !== "web"
            }
          });
          if (error) {
            throw new Error("Lory could not start Google sign-in. Try again or use email instead.");
          }
          if (!data.url) {
            throw new Error("Lory could not start Google sign-in. Try again or use email instead.");
          }

          if (Platform.OS === "web") return;

          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
          if (result.type === "success") {
            await handleAuthUrl(result.url);
            return;
          }

          if (result.type === "cancel" || result.type === "dismiss") {
            await resetAfterAuthCallbackFailure();
            return;
          }

          throw new Error("Lory could not open Google sign-in. Try again or use email instead.");
        }),
      linkGoogleIdentity: () =>
        runAuthRequest(async () => {
          onboardingImportInFlightRef.current = true;
          setStatus("linkingIdentity");
          await startGoogleIdentityLink();
        }),
      continueWithEmailSession: () =>
        runAuthRequest(async () => {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (!data.session) throw new Error("Sign in with email before continuing.");
          onboardingImportInFlightRef.current = true;
          await completeStoredOnboardingImport();
          await writeGuestSessionEnabled(false);
          googleLinkPendingRef.current = false;
          setGoogleLinkPending(false);
          setSession(data.session);
          setErrorMessage(null);
          setStatus("signedIn");
          onboardingImportInFlightRef.current = false;
        }),
      refreshVerification: () =>
        runAuthRequest(async () => {
          // getSession/signInWithPassword may synchronously notify the auth
          // listener. Block signed-in rendering until the import finishes.
          onboardingImportInFlightRef.current = true;
          const sessionResult = await supabase.auth.getSession();
          if (sessionResult.error) throw sessionResult.error;

          let nextSession = sessionResult.data.session;
          if (!nextSession && pendingEmail && pendingPasswordRef.current) {
            const signInResult = await supabase.auth.signInWithPassword({
              email: pendingEmail,
              password: pendingPasswordRef.current
            });
            if (signInResult.error) {
              if (signInResult.error.message.toLowerCase().includes("email not confirmed")) {
                throw new Error("Your email is not confirmed yet. Open the verification link, then try again.");
              }
              throw signInResult.error;
            }
            nextSession = signInResult.data.session;
          }

          if (!nextSession) {
            throw new Error("Open the verification link on this device, then return and refresh the status.");
          }

          await writeGuestSessionEnabled(false);
          await completeStoredOnboardingImport();
          pendingPasswordRef.current = null;
          setSession(nextSession);
          setPendingEmail(null);
          setAwaitingAction(null);
          setStatus("signedIn");
          onboardingImportInFlightRef.current = false;
        }),
      resendVerification: () =>
        runAuthRequest(async () => {
          if (!pendingEmail) throw new Error("Return to sign up and enter your email again.");
          const { error } = await supabase.auth.resend({
            type: "signup",
            email: pendingEmail,
            options: { emailRedirectTo: getAuthRedirectUrl() }
          });
          if (error) throw error;
        }),
      requestPasswordReset: (email) =>
        runAuthRequest(async () => {
          const normalizedEmail = email.trim().toLowerCase();
          const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo: getAuthRedirectUrl()
          });
          if (error) throw error;
          setPendingEmail(normalizedEmail);
          setAwaitingAction("passwordReset");
          setStatus("awaitingVerification");
        }),
      updatePassword: (password) =>
        runAuthRequest(async () => {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
          setStatus("signedIn");
          setAwaitingAction(null);
        }),
      returnToSignIn: () => {
        void clearGoogleLinkIntent();
        googleLinkPendingRef.current = false;
        setGoogleLinkPending(false);
        authCallbackFailureRef.current = false;
        pendingPasswordRef.current = null;
        setSession(null);
        setPendingEmail(null);
        setAwaitingAction(null);
        setErrorMessage(null);
        setAuthView("signIn");
        setStatus("signedOut");
      },
      signOut: () =>
        runAuthRequest(async () => {
          await clearGoogleLinkIntent();
          googleLinkPendingRef.current = false;
          setGoogleLinkPending(false);
          if (status === "guest") {
            await writeGuestSessionEnabled(false);
          } else {
            const userId = session?.user.id;
            const { error } = await supabase.auth.signOut({ scope: "local" });
            if (error) throw error;
            if (userId) await clearCachedGameState(userId);
          }
          setSession(null);
          pendingPasswordRef.current = null;
          setStatus("signedOut");
          setAuthView("signIn");
        })
    }),
    [
      awaitingAction,
      errorMessage,
      isSubmitting,
      pendingEmail,
      runAuthRequest,
      session,
      startGoogleIdentityLink,
      setView,
      showGoogleLinkFailure,
      status,
      view,
      googleLinkPending,
      cancelGoogleLinkRecovery
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
