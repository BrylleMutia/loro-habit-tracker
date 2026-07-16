import * as Linking from "expo-linking";
import type { EmailOtpType } from "@supabase/supabase-js";

import { supabase } from "./supabaseClient";

export function getAuthRedirectUrl() {
  return Linking.createURL("auth/callback");
}

function getAuthUrlParameters(url: string) {
  const parameters = new URLSearchParams();
  const queryStart = url.indexOf("?");
  const fragmentStart = url.indexOf("#");
  const queryEnd = fragmentStart >= 0 ? fragmentStart : url.length;

  if (queryStart >= 0) {
    new URLSearchParams(url.slice(queryStart + 1, queryEnd)).forEach((value, key) => {
      parameters.set(key, value);
    });
  }

  if (fragmentStart >= 0) {
    new URLSearchParams(url.slice(fragmentStart + 1)).forEach((value, key) => {
      parameters.set(key, value);
    });
  }

  return parameters;
}

export async function createSessionFromAuthUrl(url: string) {
  const parameters = getAuthUrlParameters(url);
  const errorDescription = parameters.get("error_description");

  if (errorDescription) {
    throw new Error(errorDescription.replace(/\+/g, " "));
  }

  const authType = parameters.get("type");
  const isRecovery = authType === "recovery";
  const authCode = parameters.get("code");

  if (authCode) {
    const { error } = await supabase.auth.exchangeCodeForSession(authCode);
    if (error) throw error;
    return { handled: true, isRecovery };
  }

  const tokenHash = parameters.get("token_hash");
  if (tokenHash && authType) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: authType as EmailOtpType
    });
    if (error) throw error;
    return { handled: true, isRecovery };
  }

  const accessToken = parameters.get("access_token");
  const refreshToken = parameters.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    if (error) throw error;
    return { handled: true, isRecovery };
  }

  return { handled: false, isRecovery: false };
}
