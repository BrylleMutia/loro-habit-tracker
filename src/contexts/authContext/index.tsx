import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
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

import { createSessionFromAuthUrl, getAuthRedirectUrl } from "../../services/authLinks";
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
  setView: (view: AuthView) => void;
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
  // This is intentionally memory-only and is cleared as soon as signup is confirmed or abandoned.
  const pendingPasswordRef = useRef<string | null>(null);
  const onboardingImportInFlightRef = useRef(false);
  const authInitializationCompleteRef = useRef(false);

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

  const setView = useCallback((nextView: AuthView) => {
    setErrorMessage(null);
    setAuthView(nextView);
  }, []);

  const handleAuthUrl = useCallback(async (url: string) => {
    if (!isSupabaseConfigured) return;

    try {
      setErrorMessage(null);
      // Session creation emits SIGNED_IN before the awaited auth call returns.
      // Keep RootGate closed until the onboarding import has committed.
      onboardingImportInFlightRef.current = true;
      const result = await createSessionFromAuthUrl(url);
      if (result.handled && result.isRecovery) {
        onboardingImportInFlightRef.current = false;
        setStatus("passwordRecovery");
      } else if (result.handled) {
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
      } else {
        onboardingImportInFlightRef.current = false;
      }
    } catch (error) {
      onboardingImportInFlightRef.current = false;
      setSession(null);
      setStatus("signedOut");
      setErrorMessage(getAuthErrorMessage(error));
    }
  }, [completeStoredOnboardingImport]);

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

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      view,
      session,
      user: session?.user ?? null,
      pendingEmail,
      awaitingAction,
      errorMessage,
      isSubmitting,
      isConfigured: isSupabaseConfigured,
      isGuest: status === "guest",
      setView,
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
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password
          });
          if (error) throw error;
          pendingPasswordRef.current = null;
          await writeGuestSessionEnabled(false);
          setSession(data.session);
          setStatus("signedIn");
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
      setView,
      status,
      view
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
