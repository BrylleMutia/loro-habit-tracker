export type ParsedAuthCallback =
  | { kind: "ignored"; handled: false }
  | { kind: "cancelled"; callbackKey: string; handled: true; isRecovery: false }
  | {
      callbackKey: string;
      errorCode: string | null;
      handled: true;
      isRecovery: false;
      kind: "error";
      message: string;
    }
  | {
      authCode: string;
      callbackKey: string;
      handled: true;
      isRecovery: boolean;
      kind: "code";
    }
  | {
      authType: string;
      callbackKey: string;
      handled: true;
      isRecovery: boolean;
      kind: "otp";
      tokenHash: string;
    }
  | {
      accessToken: string;
      callbackKey: string;
      handled: true;
      isRecovery: false;
      kind: "session";
      refreshToken: string;
    };

export class AuthCallbackError extends Error {
  readonly code: string | null;

  constructor(message: string, code: string | null = null) {
    super(message);
    this.name = "AuthCallbackError";
    this.code = code;
  }
}

export function getAuthUrlParameters(url: string) {
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

function normalizeCallbackBase(url: string) {
  const parsed = new URL(url);
  const normalizedPath = parsed.pathname.replace(/\/+$/, "") || "/";
  return `${parsed.protocol}//${parsed.host}${normalizedPath}`;
}

export function isAuthCallbackUrl(url: string, allowedRedirectUrls: readonly string[]) {
  try {
    const callbackBase = normalizeCallbackBase(url);
    return allowedRedirectUrls.some(
      (redirectUrl) => normalizeCallbackBase(redirectUrl) === callbackBase
    );
  } catch {
    return false;
  }
}

export function getAuthCallbackKey(url: string) {
  const parameters = getAuthUrlParameters(url);
  return (
    parameters.get("code") ??
    parameters.get("token_hash") ??
    (parameters.has("access_token") || parameters.has("refresh_token")
      ? `${parameters.get("access_token") ?? ""}:${parameters.get("refresh_token") ?? ""}`
      : parameters.get("error") ?? parameters.get("error_description") ?? null)
  );
}

function getProviderErrorMessage(errorCode: string | null, errorDescription: string | null) {
  if (errorCode === "access_denied") {
    return "Google sign-in was canceled. You can try again or use email instead.";
  }

  const combinedError = `${errorCode ?? ""} ${errorDescription ?? ""}`.toLowerCase();
  if (
    errorCode === "identity_already_exists" ||
    /identity.*already.*exist|already.*registered|already.*exist/.test(combinedError)
  ) {
    return "This Google account already has a Loro account. Sign in with email to connect Google.";
  }

  if (errorDescription) {
    return errorDescription.replace(/\+/g, " ");
  }

  return "The sign-in provider could not complete the request. Try again or use email instead.";
}

export function parseAuthCallbackUrl(
  url: string,
  allowedRedirectUrls: readonly string[]
): ParsedAuthCallback {
  if (!isAuthCallbackUrl(url, allowedRedirectUrls)) {
    return { kind: "ignored", handled: false };
  }

  const parameters = getAuthUrlParameters(url);
  const callbackKey = getAuthCallbackKey(url) ?? "callback";
  const errorCode = parameters.get("error");
  const errorDescription = parameters.get("error_description");

  if (errorCode || errorDescription) {
    if (errorCode === "access_denied" && !errorDescription) {
      return { callbackKey, handled: true, isRecovery: false, kind: "cancelled" };
    }

    return {
      callbackKey,
      errorCode,
      handled: true,
      isRecovery: false,
      kind: "error",
      message: getProviderErrorMessage(errorCode, errorDescription)
    };
  }

  const authType = parameters.get("type");
  const isRecovery = authType === "recovery";
  const authCode = parameters.get("code");

  if (authCode) {
    return { authCode, callbackKey, handled: true, isRecovery, kind: "code" };
  }

  const tokenHash = parameters.get("token_hash");
  if (tokenHash && authType) {
    return {
      authType,
      callbackKey,
      handled: true,
      isRecovery,
      kind: "otp",
      tokenHash
    };
  }

  const accessToken = parameters.get("access_token");
  const refreshToken = parameters.get("refresh_token");
  if (accessToken && refreshToken) {
    return {
      accessToken,
      callbackKey,
      handled: true,
      isRecovery: false,
      kind: "session",
      refreshToken
    };
  }

  return {
    callbackKey,
    errorCode: null,
    handled: true,
    isRecovery: false,
    kind: "error",
    message: "The sign-in callback was incomplete. Try again or use email instead."
  };
}
