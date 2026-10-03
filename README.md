# LIGHT OF THE WORD

An Expo Router / React Native Bible app with an Express + tRPC API, MongoDB email accounts, an API.Bible KJV adapter, and local-first reading state. It is built with **voice-first use and screen-reader accessibility** in mind.

## Project map

| Path | Purpose |
|---|---|
| `app/` | Expo Router screens: Reader, Navigate, Bookmarks, Settings, onboarding, Profile, Login, Signup. |
| `components/`, `hooks/`, `lib/` | Shared accessible UI, state, Bible catalog/cache, speech, and API clients. |
| `backend/` | **The backend:** Express app, tRPC routers, account/auth routes, MongoDB access, API.Bible adapter, and server integrations. Start at `backend/_core/index.ts`. |
| `shared/` | Types and utilities shared with the backend. |
| `drizzle/` | Existing scaffold migrations for its legacy SQL/OAuth metadata; MongoDB account data is managed in `backend/`. |
| `tests/` | Unit tests for Bible data, voice commands, locale selection, accounts, and service adapters. |
| `docs/` | Setup and integration guides. See `docs/SETUP.md`, `docs/INTEGRATION_STATUS.md`, and `docs/VOICE_AND_COMMANDS.md`. |
| [`VOICE_COMMANDS_README.md`](VOICE_COMMANDS_README.md) | Full voice-first guide: references, playback, navigation, bookmarks, settings, localized phrases, permission recovery, and native device testing. |

## Run and verify

- `pnpm dev` starts the Expo web preview and Express backend together.
- `pnpm dev:server` runs only the backend.
- `pnpm dev:metro` runs only Expo/Metro.
- `pnpm test && pnpm check && pnpm lint` runs tests and static checks.
- `pnpm test:integration` runs opt-in live API.Bible and MongoDB checks; it requires configured secrets.
- `pnpm build` bundles the backend for production; `pnpm start` runs the generated bundle.

Configure server-only credentials using [`docs/SETUP.md`](docs/SETUP.md). Never put MongoDB credentials or the API.Bible key in `EXPO_PUBLIC_` variables.

## Voice-first access

There is no text-entry fallback in the voice controller. Activating its accessible microphone button starts listening directly; spoken command results, status, help, and error/retry guidance are available audibly and to screen readers. It can start from onboarding, change command language by voice, and read the English KJV continuously until **Stop** or **Pause**. Recognition requires a working device/browser speech service and microphone permission. Native use requires a custom Expo development build; Expo Go does not contain the speech-recognition native module.

See [`VOICE_COMMANDS_README.md`](VOICE_COMMANDS_README.md) for every currently supported phrase and physical-device acceptance steps. Language selection changes command recognition; it does **not** translate the KJV Bible text or most screen labels.

## Data behavior

Bookmarks and preferences stay local. Bible chapters are fetched through the backend and cached on the device subject to API.Bible's provider terms and refresh policy. Small bundled verse samples are explicitly marked preview content, not a complete KJV dataset.
