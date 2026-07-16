import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { createSessionFromAuthUrl, getAuthRedirectUrl } from "../../services/authLinks";
import { clearCachedGameState } from "../../services/gameCache";
import {
  readGuestSessionEnabled,
  writeGuestSessionEnabled
} from "../../services/guestSession";
import { isSupabaseConfigured, supabase } from "../../services/supabaseClient";
import type { AuthStatus, AuthView, AwaitingAuthAction } from "../../types/backend";

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
  signUp: (displayName: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  verifyEmailCode: (code: string) => Promise<void>;
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

  const setView = useCallback((nextView: AuthView) => {
    setErrorMessage(null);
    setAuthView(nextView);
  }, []);

  const handleAuthUrl = useCallback(async (url: string) => {
    if (!isSupabaseConfigured) return;

    try {
      setErrorMessage(null);
      const result = await createSessionFromAuthUrl(url);
      if (result.handled && result.isRecovery) setStatus("passwordRecovery");
    } catch (error) {
      setSession(null);
      setStatus("signedOut");
      setErrorMessage(getAuthErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let removeAuthListener: (() => void) | null = null;
    const linkListener = Linking.addEventListener("url", ({ url }) => {
      void handleAuthUrl(url);
    });

    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);

        if (event === "PASSWORD_RECOVERY") {
          setStatus("passwordRecovery");
        } else if (nextSession) {
          void writeGuestSessionEnabled(false);
          setStatus((current) => (current === "passwordRecovery" ? current : "signedIn"));
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
          if (isMounted) setStatus(guestEnabled ? "guest" : "signedOut");
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
          await writeGuestSessionEnabled(false);
          setStatus("signedIn");
        } else {
          setStatus(guestEnabled ? "guest" : "signedOut");
        }
        if (initialUrl) void handleAuthUrl(initialUrl);
      } catch (error) {
        if (!isMounted) return;
        setStatus("signedOut");
        setErrorMessage(getAuthErrorMessage(error));
      }
    })();

    return () => {
      isMounted = false;
      removeAuthListener?.();
      linkListener.remove();
    };
  }, [handleAuthUrl]);

  const runAuthRequest = useCallback(async (request: () => Promise<void>) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await request();
    } catch (error) {
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
          await writeGuestSessionEnabled(true);
          setSession(null);
          setAwaitingAction(null);
          setStatus("guest");
        }),
      signUp: (displayName, email, password) =>
        runAuthRequest(async () => {
          if (!isSupabaseConfigured) throw new Error("Supabase is not configured yet.");
          const normalizedName = displayName.trim();
          const normalizedEmail = email.trim().toLowerCase();
          if (!normalizedName) throw new Error("Enter the name Lory should call you.");

          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: getAuthRedirectUrl(),
              data: { display_name: normalizedName, time_zone: getDeviceTimeZone() }
            }
          });
          if (error) throw error;

          if (data.session) {
            await writeGuestSessionEnabled(false);
            setSession(data.session);
            setStatus("signedIn");
          } else {
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
          await writeGuestSessionEnabled(false);
          setSession(data.session);
          setStatus("signedIn");
        }),
      verifyEmailCode: (code) =>
        runAuthRequest(async () => {
          if (!pendingEmail) throw new Error("Return to sign up and enter your email again.");
          const { data, error } = await supabase.auth.verifyOtp({
            email: pendingEmail,
            token: code,
            type: "signup"
          });
          if (error) throw error;
          if (!data.session) throw new Error("That code could not be verified.");
          await writeGuestSessionEnabled(false);
          setSession(data.session);
          setAwaitingAction(null);
          setStatus("signedIn");
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
