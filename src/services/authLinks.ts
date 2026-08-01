import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import type { EmailOtpType } from "@supabase/supabase-js";

import {
  AuthCallbackError,
  getAuthCallbackKey,
  getAuthUrlParameters,
  isAuthCallbackUrl as isAuthCallbackUrlBase,
  parseAuthCallbackUrl,
  type ParsedAuthCallback
} from "./authCallback";
import { supabase } from "./supabaseClient";

WebBrowser.maybeCompleteAuthSession();

export type { ParsedAuthCallback } from "./authCallback";
export {
  AuthCallbackError,
  getAuthCallbackKey,
  getAuthUrlParameters,
  parseAuthCallbackUrl
} from "./authCallback";

export type AuthUrlHandlingResult = {
  callbackKey?: string;
  cancelled?: boolean;
  handled: boolean;
  isRecovery: boolean;
};

export function getAuthRedirectUrl() {
  // Email links are commonly opened in a desktop browser. On web, use the
  // origin that is serving the app instead of a native deep-link scheme or an
  // Expo Go URL. This also keeps local development on the active Expo port.
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return new URL("/auth/callback", window.location.origin).toString();
  }

  return Linking.createURL("auth/callback");
}

export function getGoogleAuthRedirectUrl() {
  if (Platform.OS === "web") {
    return getAuthRedirectUrl();
  }

  return AuthSession.makeRedirectUri({
    path: "auth/callback",
    scheme: "loro"
  });
}

function getAllowedAuthRedirectUrls() {
  return [getAuthRedirectUrl(), getGoogleAuthRedirectUrl()];
}

export function isAuthCallbackUrl(url: string) {
  return isAuthCallbackUrlBase(url, getAllowedAuthRedirectUrls());
}

export async function createSessionFromAuthUrl(url: string): Promise<AuthUrlHandlingResult> {
  const parsed: ParsedAuthCallback = parseAuthCallbackUrl(url, getAllowedAuthRedirectUrls());

  if (!parsed.handled) {
    return { handled: false, isRecovery: false };
  }

  if (parsed.kind === "cancelled") {
    return { callbackKey: parsed.callbackKey, cancelled: true, handled: true, isRecovery: false };
  }

  if (parsed.kind === "error") {
    throw new AuthCallbackError(parsed.message, parsed.errorCode);
  }

  if (parsed.kind === "code") {
    const { error } = await supabase.auth.exchangeCodeForSession(parsed.authCode);
    if (error) throw error;
    return {
      callbackKey: parsed.callbackKey,
      handled: true,
      isRecovery: parsed.isRecovery
    };
  }

  if (parsed.kind === "otp") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: parsed.tokenHash,
      type: parsed.authType as EmailOtpType
    });
    if (error) throw error;
    return {
      callbackKey: parsed.callbackKey,
      handled: true,
      isRecovery: parsed.isRecovery
    };
  }

  const { error } = await supabase.auth.setSession({
    access_token: parsed.accessToken,
    refresh_token: parsed.refreshToken
  });
  if (error) throw error;
  return {
    callbackKey: parsed.callbackKey,
    handled: true,
    isRecovery: false
  };
}
