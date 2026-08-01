# Loro - Gamified Habits

Loro - Gamified Habits is an Expo app whose durable game state is backed by Supabase Auth and Postgres. The app keeps Context as its UI-facing state layer, while authenticated Postgres functions own rewards, energy, streaks, path progress, and activity history.

## Project documentation

- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product concept, game-loop rules, terminology, Lory voice, UX boundaries, and visual direction
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — client/backend architecture, state ownership, security, persistence, testing, and delivery standards
- [`docs/PLANS.md`](docs/PLANS.md) — feature priorities, statuses, implementation blueprints, dependencies, and technical debt
- [`docs/history/README.md`](docs/history/README.md) — monthly implementation history and significant engineering/product decisions
- [`AGENTS.md`](AGENTS.md) — mandatory agent workflow, repository safeguards, verification, and documentation-routing rules

## Prerequisites

- Node.js and npm
- Docker Desktop for the local Supabase stack
- A Supabase account and project for shared development

## Local setup

1. Install packages:

   ```powershell
   npm.cmd install
   ```

2. Copy `.env.example` to `.env`, then add the hosted project's API URL and client-safe publishable key:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Start the local stack for database migrations and tests:

   ```powershell
   npm.cmd run supabase:start
   ```

4. Apply all migrations and catalog data, run database tests, and regenerate the typed RPC surface:

   ```powershell
   npm.cmd run supabase:reset
   npm.cmd run supabase:test
   npm.cmd run supabase:types
   npm.cmd run typecheck
   ```

5. Start Expo:

   ```powershell
   npm.cmd run start
   ```

The local CLI database remains useful for migrations and pgTAP tests, but the Expo app always connects to the hosted Supabase project configured in `.env`.

## Remote development project

Create the project in a region close to expected users, then link this repository without committing passwords or service-role keys:

```powershell
npx.cmd supabase login
npx.cmd supabase link --project-ref YOUR_PROJECT_REF
npm.cmd run supabase:push:dry
npm.cmd run supabase:push
npm.cmd run supabase:types:linked
```

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the hosted project values. Every app build uses these variables. For EAS builds, configure the same values in the selected EAS environment instead of relying on an uncommitted local `.env` file.

In Supabase Auth URL Configuration, allow the callbacks used by the app:

- `loro://auth/callback` for development and production builds
- the current `exp://.../--/auth/callback` URL printed by Expo Go
- `http://localhost:8081/auth/callback` for local web
- `http://localhost:8082/auth/callback` when running automated Expo web verification

### Google OAuth setup

Feature #29 uses Supabase's browser-based Google OAuth flow. Configure the provider outside the repository before testing Google sign-in:

1. In Supabase Dashboard, open **Authentication → Providers → Google** and enable Google.
2. In Google Cloud Console, create a **Web application** OAuth client and configure the consent screen.
3. Add the Supabase Auth callback URL shown on the Supabase Google provider page to Google's **Authorized redirect URIs**. Do not add the Google client secret to the Expo app or to an `EXPO_PUBLIC_*` variable; store it only in Supabase provider configuration.
4. Add every supported Loro callback to Supabase **Authentication → URL Configuration → Redirect URLs**, including the native `loro://auth/callback`, the current Expo Go callback, local web callbacks, and the preview/staging/production web origins used by the deployment.
5. Enable **manual identity linking** in the same Supabase Auth settings. This is required for the recovery flow that signs in with email/password first and then connects Google with `linkIdentity()`.
6. Test the redirect allow-list separately for development, preview, and production. The app uses the existing `loro` scheme for development builds and Expo's generated `exp://.../--/auth/callback` URL in Expo Go.

When a Google callback reports that the address already has an email/password account, Loro keeps the email session as the source of truth: the user signs in with email/password first, then the app starts an authenticated Google identity-link flow. Supabase must be able to confirm the existing email account and manual linking must be enabled. If linking is canceled or unavailable, the user can continue with email without creating or merging a second game account.

For a newly created Google profile, the signup trigger uses the provider's first-name metadata when available, then falls back to the first word of the provider name and finally `Adventurer`. Existing email-authenticated profile names are preserved when Google is linked later.

The v1 implementation opens Google in the managed browser/auth-session flow. Native Google SDK credentials, Android package/SHA configuration, iOS native provider configuration, and universal/app-link hardening remain deferred follow-up work.

Keep email confirmation enabled. Before a public launch, configure custom SMTP and create a separate production Supabase project rather than reusing development data.

## Backend workflow

- `supabase/migrations/` is the schema source of truth; do not make unreproducible dashboard-only schema changes.
- `supabase/tests/database/` contains pgTAP security and game-invariant tests.
- Run `npm.cmd run supabase:types` after every local schema change, or `supabase:types:linked` after an applied remote migration.
- Only the publishable key belongs in Expo. Never place database passwords, secret keys, or service-role keys in app environment variables.
- Client code can read only its own rows. Direct economy and progress writes are revoked; mutations go through the authenticated RPCs.

Offline sessions may read their last SQLite-cached snapshot. Quest starts, completions, daily check-ins, and reward claims require a connection and refresh the canonical snapshot after success.

## Lory AI briefing

The signed-in Home hero requests one compact daily briefing from the `generate-lory-briefing` Supabase Edge Function. Configure `DEEPSEEK_API_KEY` as a Supabase Edge Function secret before deploying the function. Keep this secret server-side; it must never be added to an `EXPO_PUBLIC_*` variable or bundled into Expo.

Guest and offline users continue to use the local habit prompt, while authenticated users read the server-cached briefing for their current local date.
