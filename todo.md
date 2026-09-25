# LIGHT OF THE WORD — implementation status

## Completed

- [x] Expo Router mobile frontend with accessible Figma-inspired Reader, Navigate, Bookmarks, Settings, onboarding, Profile, Login, and Signup.
- [x] API.Bible server adapter in `backend/api-bible.ts`; validates English KJV metadata and returns verse content/FUMS metadata without inventing scripture.
- [x] Device-local AsyncStorage cache for previously fetched chapters, subject to the provider's 30-day refresh requirement.
- [x] MongoDB account/session code under `backend/`; local bookmarks and preferences do not depend on MongoDB.
- [x] Verse text-to-speech using `expo-speech`.
- [x] Tap-to-listen voice controller uses `expo-speech-recognition` directly (no command pop-up), allows a one-minute window with pause retries, announces transcripts/status to accessibility services, gives spoken help/confirmations, and keeps a typed fallback.
- [x] Moved the source folder from `server/` to clearly visible `backend/`; updated development/build scripts, client router type import, test imports, and source comments.
- [x] Added root `README.md`, `backend/README.md`, `docs/SETUP.md`, and `docs/VOICE_AND_COMMANDS.md` to explain navigation, source ownership, commands, env setup, speech behavior, and requirements.
- [x] Unit tests cover Bible parsing (including spoken `chapter`/`verse` wording), the one-minute listening deadline, voice-command parsing, API.Bible parsing, and account primitives.

## Remaining — user configuration/device validation

- [ ] Add server-only `MONGODB_URI`, `APIBIBLE_API_KEY`, and the permitted English KJV `APIBIBLE_BIBLE_ID`.
- [ ] For native builds, set the public HTTPS backend origin in `EXPO_PUBLIC_API_BASE_URL`, then rebuild the client.
- [ ] Create/install a custom Expo development build with speech permissions; Expo Go does not include native speech recognition.
- [ ] On target iOS/Android phones, grant speech/microphone permissions and verify `Open Romans 6`, `Open John chapter 3 verse 16`, `Next verse`, and `Help`; locale availability, especially Hausa, varies by OS/device.
- [ ] Test real Mongo account registration/login and live API.Bible fetch after configuration.
- [ ] Confirm translation rights and deployment-specific FUMS requirements before publishing/monetizing.

## Not included

- Email verification, password-reset email, cloud synchronization of bookmarks/history, or full KJV download to every device.
- Guaranteed offline speech recognition or guaranteed Hausa recognition; these depend on the installed OS speech service.
- `.vpc` import, since it is not a standard Bible text interchange format.
