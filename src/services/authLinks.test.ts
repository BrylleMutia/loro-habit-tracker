import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { getAuthCallbackKey, getAuthUrlParameters, isAuthCallbackUrl, parseAuthCallbackUrl } from "./authCallback.ts";

const nativeRedirect = "loro://auth/callback";
const webRedirect = "http://localhost:8082/auth/callback";

test("reads query parameters from an OAuth callback", () => {
  const parameters = getAuthUrlParameters(`${nativeRedirect}?code=oauth-code&type=signup`);

  assert.equal(parameters.get("code"), "oauth-code");
  assert.equal(parameters.get("type"), "signup");
});

test("parses a PKCE authorization code callback", () => {
  const parsed = parseAuthCallbackUrl(
    `${nativeRedirect}?code=oauth-code&type=signup`,
    [nativeRedirect]
  );

  assert.deepEqual(parsed, {
    authCode: "oauth-code",
    callbackKey: "oauth-code",
    handled: true,
    isRecovery: false,
    kind: "code"
  });
});

test("parses access and refresh tokens from a callback fragment", () => {
  const callbackUrl = `${webRedirect}#access_token=access-token&refresh_token=refresh-token`;
  const parsed = parseAuthCallbackUrl(callbackUrl, [webRedirect]);

  assert.deepEqual(parsed, {
    accessToken: "access-token",
    callbackKey: "access-token:refresh-token",
    handled: true,
    isRecovery: false,
    kind: "session",
    refreshToken: "refresh-token"
  });
});

test("treats provider cancellation as a handled non-error callback", () => {
  const parsed = parseAuthCallbackUrl(
    `${nativeRedirect}?error=access_denied`,
    [nativeRedirect]
  );

  assert.deepEqual(parsed, {
    callbackKey: "access_denied",
    handled: true,
    isRecovery: false,
    kind: "cancelled"
  });
});

test("gives existing-account guidance for an OAuth identity conflict", () => {
  const parsed = parseAuthCallbackUrl(
    `${webRedirect}?error=identity_already_exists&error_description=Identity+already+exists`,
    [webRedirect]
  );

  assert.deepEqual(parsed, {
    callbackKey: "identity_already_exists",
    errorCode: "identity_already_exists",
    handled: true,
    isRecovery: false,
    kind: "error",
    message:
      "This Google account already has a Loro account. Sign in with email to connect Google."
  });
});

test("returns provider-neutral errors for incomplete callbacks", () => {
  const parsed = parseAuthCallbackUrl(nativeRedirect, [nativeRedirect]);

  assert.equal(parsed.kind, "error");
  if (parsed.kind === "error") {
    assert.match(parsed.message, /callback was incomplete/i);
  }
});

test("ignores URLs outside the configured callback base", () => {
  const maliciousUrl = "https://malicious.example/auth/callback?code=attacker-code";

  assert.equal(isAuthCallbackUrl(maliciousUrl, [nativeRedirect]), false);
  assert.deepEqual(parseAuthCallbackUrl(maliciousUrl, [nativeRedirect]), {
    kind: "ignored",
    handled: false
  });
});

test("uses the one-time authorization code as the duplicate-delivery key", () => {
  assert.equal(
    getAuthCallbackKey(`${nativeRedirect}?code=one-time-code&type=signup`),
    "one-time-code"
  );
});
