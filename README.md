# Loro Habit Tracker

Loro is an Expo habit tracker whose durable game state is backed by Supabase Auth and Postgres. The app keeps Context as its UI-facing state layer, while authenticated Postgres functions own rewards, energy, streaks, path progress, and activity history.

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

Keep email confirmation enabled. Before a public launch, configure custom SMTP and create a separate production Supabase project rather than reusing development data.

## Backend workflow

- `supabase/migrations/` is the schema source of truth; do not make unreproducible dashboard-only schema changes.
- `supabase/tests/database/` contains pgTAP security and game-invariant tests.
- Run `npm.cmd run supabase:types` after every local schema change, or `supabase:types:linked` after an applied remote migration.
- Only the publishable key belongs in Expo. Never place database passwords, secret keys, or service-role keys in app environment variables.
- Client code can read only its own rows. Direct economy and progress writes are revoked; mutations go through the authenticated RPCs.

Offline sessions may read their last SQLite-cached snapshot. Quest starts, completions, daily check-ins, and reward claims require a connection and refresh the canonical snapshot after success.
