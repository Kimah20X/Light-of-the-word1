# LIGHT OF THE WORD — implementation plan

## Direction

Keep the Expo Router/React Native client and its local reading state. Integrate API.Bible via the Express API, which now lives in root-level `backend/`; add MongoDB email/password accounts beside the existing OAuth metadata flow. Use the system/browser speech recognizer for commands, and local `expo-speech` for verse narration. The user will add service credentials separately.

## Completed

1. `backend/api-bible.ts` maps canonical books to API.Bible, validates chapters and KJV metadata, and fetches chapter/verse content with FUMS metadata.
2. The mobile app caches fetched chapters locally; previously opened chapters are available offline until the provider's 30-day refresh window requires revalidation. The web preview reports FUMS for viewed verses.
3. `backend/account-auth.ts` and `backend/_core/account-routes.ts` implement MongoDB accounts and expiring, revocable sessions with salted scrypt password hashes, request validation and rate limiting. Login, signup, profile, and settings connect to these routes.
4. Verse narration remains local via `expo-speech`; Reader controls cover start/pause/stop, repeat, speed, and typed/voice-intent controls.
5. The floating microphone now supports one-utterance speech recognition via `expo-speech-recognition`, sends final transcripts into the existing local command parser, and preserves the typed-command fallback.
6. Renamed `server/` to visible root folder `backend/`; updated imports/tests/build commands and documented the source tree in `README.md` and `backend/README.md`.
7. Added `docs/VOICE_AND_COMMANDS.md` and `docs/SETUP.md` for permissions, native development builds, privacy notes, configuration and rights disclosures.

## Still requires user setup/device work

- Configure `MONGODB_URI`, API.Bible credentials/edition, and (for native builds) the HTTPS API base URL as documented in `docs/SETUP.md`.
- Create/install a custom native Expo development build to exercise speech recognition on physical iOS/Android devices; Expo Go does not include this native module. Web recognition varies by browser.
- Verify available speech-recognition locales and OS permissions on each target phone. Hausa availability and offline recognition depend on installed device-service support.
- Run a live Mongo registration/sign-in and API.Bible chapter-fetch test after the user-provided secrets are added.
- Email verification, password reset, cloud sync, and preloading the entire Bible are not included.

See [`docs/SETUP.md`](docs/SETUP.md) and [`docs/VOICE_AND_COMMANDS.md`](docs/VOICE_AND_COMMANDS.md) for the actionable steps.
