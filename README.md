# Pulse Chat

An Expo and React Native direct-messaging app with Supabase Auth, Postgres storage, and Supabase Realtime.

## Requirements

- Node.js 22.13 or newer
- A Supabase project
- Expo Go on a phone, or an Android emulator

## Supabase setup

1. Open the Supabase SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql).
2. Copy `.env.example` to `.env`.
3. In Supabase project settings, copy the Project URL and the publishable key (or legacy anon key) into `.env` as `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
4. Restart Expo after changing `.env` so the public environment variables are reloaded.
5. Create two accounts on separate devices to test live delivery. Supabase may require email confirmation, depending on the project's Auth settings.

The schema enables row-level security for profiles, conversations, and messages. The app only needs the public client key; never put a Supabase `service_role` key in a mobile app or an `EXPO_PUBLIC_` variable.

## Run

```powershell
npm install
npm start
```

Scan the Expo QR code with Expo Go, or press `a` to open an Android emulator. Use `npm run typecheck` to run the TypeScript check.

Without Supabase credentials, the app displays the backend setup screen. Once connected, create an account, open the People tab, and select another account to start a direct conversation. Messages are stored in Postgres and delivered to open chat threads through a Supabase Realtime subscription.
