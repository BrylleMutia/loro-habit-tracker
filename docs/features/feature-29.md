# Feature #29 - SSO Login (Google) (P3)

> Roadmap index: [PLANS.md](../PLANS.md#feature-29)

### <a id="feature-29"></a>29. SSO Login (Google) (P3)

**What:** Google Sign-In as an alternative to email magic link.

**Why:** User-requested as MUST. Reduces signup friction significantly.

**Implementation notes:**
- ✅ Supabase Google OAuth is enabled through the existing authenticated session model.
- ✅ Use `@supabase/supabase-js` `signInWithOAuth` with `provider: 'google'`.
- ✅ Google Cloud Console and Supabase provider configuration are documented as deployment prerequisites.
- ✅ Redirect handling uses `expo-auth-session`, `expo-web-browser`, and the existing `expo-linking` callback path.
- ✅ Add "Continue with Google" buttons to the sign-in and sign-up auth views.
- ✅ Keep existing email/password, verification, recovery, and guest flows as fallbacks.
- ✅ Pending guest/onboarding imports complete before the authenticated game snapshot is exposed.
- ✅ Recover an existing email/password account after a Google identity conflict by reauthenticating with email and using Supabase `linkIdentity`; cancellation keeps the email session authoritative and never merges game profiles client-side.
- ✅ New Google profiles derive their initial display name from provider first-name metadata while preserving existing profile names during identity linking.

---

## Delivery Blueprint — Phase 4 — Identity, Social, Economy, and Launch

### <a id="blueprint-feature-29"></a>Feature #29 — Google Sign-In

**Recommended first implementation**

- ✅ Add web-based Google OAuth through Supabase using the SDK 54-compatible Expo Auth Session/Web Browser flow. This fits the managed app and reuses Supabase's session model.
- ✅ Reuse the stable `loro` app scheme and explicit `auth/callback` path in `app.json`, Supabase Auth redirect allow-list, and deployment setup documentation.
- ✅ Document separate development, preview, and production redirect URIs. Universal/app links remain a later hardening step and require development builds plus website association.
- ✅ Call `signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect } })`, open the returned URL in an auth session on native platforms, and establish the Supabase session from the verified callback through PKCE code exchange.
- ✅ Use provider/state/nonce protections supplied by the current libraries; never disable nonce validation merely to make a callback pass.

**Client integration**

- ✅ Put provider-specific logic behind `authContext` intent methods. `AuthScreen` renders “Continue with Google” but does not parse tokens or mutate user/game state.
- ✅ Reuse `RootGate` hydration after session establishment; do not maintain a parallel Google-user state.
- ✅ Handle cancel, provider error, missing callback parameters, expired flow, network loss, duplicate callback delivery, and an already-authenticated identity.
- ✅ Leave account-linking and identity ownership to Supabase; show a clear provider-neutral fallback and never merge game profiles client-side.
- ✅ Recover identity conflicts by reauthenticating the existing email account and calling Supabase `linkIdentity`, while keeping onboarding import and authenticated game hydration behind the verified linked session.
- ✅ Derive a new Google account's initial profile name from provider first-name metadata and preserve existing names during later identity linking.
- ✅ Keep email auth as fallback and add provider-neutral error copy.

**Verification and operations**

- ✅ Document Google Console consent screen, Supabase provider settings, and redirect allow-list verification. Native package/SHA and iOS bundle configuration remain deferred because v1 uses browser OAuth.
- ✅ Add callback parsing coverage and verify Android/iOS/web scenarios, cold/warm callback, cancellation, duplicate delivery, existing email account, logout/login, session persistence/refresh, and malicious callback URL handling when provider configuration is available.
