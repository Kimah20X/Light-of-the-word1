# LIGHT OF THE WORD

An Expo Router / React Native Bible app with an Express + tRPC API, MongoDB email accounts, an API.Bible KJV adapter, and local-first reading state.

## Project map

| Path | Purpose |
|---|---|
| `app/` | Expo Router screens: Reader, Navigate, Bookmarks, Settings, onboarding, Profile, Login, Signup. |
| `components/`, `hooks/`, `lib/` | Shared accessible UI, state, Bible catalog/cache, speech, and API clients. |
| `backend/` | **The backend:** Express app, tRPC routers, account/auth routes, MongoDB access, API.Bible adapter, and server integrations. Start at `backend/_core/index.ts`. |
| `shared/` | Types and utilities shared with the backend. |
| `drizzle/` | Existing scaffold migrations for its legacy SQL/OAuth metadata; MongoDB account data is managed in `backend/`. |
| `tests/` | Unit tests for the Bible adapter, local command parsing, auth primitives, and existing routes. |
| `docs/` | Setup and feature guides. Start with [`docs/SETUP.md`](docs/SETUP.md) and [`docs/VOICE_AND_COMMANDS.md`](docs/VOICE_AND_COMMANDS.md). |

## Run locally

- `pnpm dev` starts the Expo web preview and Express backend together.
- `pnpm dev:server` runs only the backend.
- `pnpm dev:metro` runs only Expo/Metro.
- `pnpm test && pnpm check && pnpm lint` runs tests and static checks.
- `pnpm build` bundles the backend for production; `pnpm start` runs the generated bundle.

Configure server-only credentials using the steps in [`docs/SETUP.md`](docs/SETUP.md). Never put MongoDB credentials or the API.Bible key in `EXPO_PUBLIC_` variables.

## Speech

Verse narration is text-to-speech through `expo-speech`. The floating microphone uses the device/browser speech-recognition service for one spoken command and passes the final transcript to the same local parser used by typed commands. Native recognition requires a custom Expo development build with the config plugin; Expo Go does not contain this native module. See [`docs/VOICE_AND_COMMANDS.md`](docs/VOICE_AND_COMMANDS.md).

## Data behavior

Bookmarks and preferences stay local. Bible chapters are fetched through the backend and cached on the device subject to the provider's refresh and usage rules. The currently bundled verse samples are only UI-preview content, not a complete KJV Bible.
