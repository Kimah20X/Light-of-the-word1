# LIGHT OF THE WORD — implementation status

## Completed

- [x] Expo Router mobile frontend with accessible Figma-inspired Reader, Navigate, Bookmarks, Settings, onboarding, Profile, Login, and Signup.
- [x] API.Bible server adapter in `backend/api-bible.ts`; validates English KJV metadata and returns verse content/FUMS metadata without inventing scripture.
- [x] Device-local AsyncStorage cache for previously fetched chapters, subject to the provider's 30-day refresh requirement.
- [x] MongoDB account/session code under `backend/`; local bookmarks and preferences do not depend on MongoDB.
- [x] Verse text-to-speech using `expo-speech`.
- [x] Tap-to-listen voice controller uses `expo-speech-recognition` directly (no command pop-up), allows a one-minute idle window with pause retries, announces transcripts/status to accessibility services, gives spoken help/confirmations, and keeps a typed fallback. Recognition is biased toward Bible names and Stop/Pause; phone/OS controls physical microphone gain.
- [x] Continuous TTS advances verse-by-verse through chapter/book boundaries until Stop/Pause; Reader controls expose accessible stop and repeat actions.
- [x] Replaced Expo starter assets with an amber open-Bible launcher icon, Android adaptive/monochrome icons, splash mark, and web favicon.
- [x] Moved the source folder from `server/` to clearly visible `backend/`; updated development/build scripts, client router type import, test imports, and source comments.
- [x] Added root `README.md`, `backend/README.md`, `docs/SETUP.md`, and `docs/VOICE_AND_COMMANDS.md` to explain navigation, source ownership, commands, env setup, speech behavior, and requirements.
- [x] Unit tests cover Bible parsing (including spoken `chapter`/`verse` wording), the one-minute listening deadline, voice-command parsing, API.Bible parsing, and account primitives.
- [x] Voice Save/Bookmark commands save the current verse idempotently, announce saved/already-saved feedback, and persist locally.
- [x] Backend-local `.env` loading with runtime-secret precedence and Git ignore protection; values configured using the secure project-secrets form.
- [x] Live API.Bible KJV Romans 6 retrieval passed; nested verse-span parsing corrected; Reader display and chapter cache verified in the browser.

## Remaining — user configuration/device validation

- [ ] Resolve MongoDB TLS/network connectivity: the corrected URI is stored and parseable, but all discovered servers reject the TLS handshake. Check Atlas Network Access and cluster availability before retrying.
- [ ] For native builds, set the public HTTPS backend origin in `EXPO_PUBLIC_API_BASE_URL`, then rebuild the client.
- [ ] Create/install a custom Expo development build with speech permissions; Expo Go does not include native speech recognition.
- [ ] On target iOS/Android phones, grant speech/microphone permissions and verify `Open Romans 6`, `Open John chapter 3 verse 16`, `Read` then `Stop` mid-verse, `Next verse`, and `Help`; recognition quality and mic gain remain OS/device-controlled and locales vary.
- [ ] Test real Mongo account registration/login after the MongoDB connection succeeds. Live Bible fetching is already verified.
- [ ] Confirm translation rights and deployment-specific FUMS requirements before publishing/monetizing.

## Not included

- Email verification, password-reset email, cloud synchronization of bookmarks/history, or full KJV download to every device.
- Guaranteed offline speech recognition or guaranteed Hausa recognition; these depend on the installed OS speech service.
- `.vpc` import, since it is not a standard Bible text interchange format.
