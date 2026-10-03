# Integration status

**Last checked:** 2026-10-03. Results are point-in-time checks and do not guarantee availability on a later deploy.

## Verified

- The live API.Bible test fetched the real English KJV Romans 6 chapter, and the live MongoDB test authenticated and returned a ping from the configured database.
- The voice parser and language helper have unit coverage. Voice-controller startup, spoken language changes, and Android recognizer selection were reviewed; preview microphone permission behavior is described below.
- The Reader can continue through verses and chapters, stop on spoken Stop/Pause, and keep verse bookmarks local. `VOICE_COMMANDS_README.md` contains the supported voice phrases.

## Not verified yet

- A live authenticated ping does not prove account registration, password login, session renewal, and logout end-to-end; test those only with a dedicated test account and non-production database.
- **Voice on a physical iOS/Android device is not verified.** The sandbox preview browser denied microphone/speech access; it displayed an accessible permission error and Listen again. That is a sandbox browser restriction, not evidence about the user's device. Native recognition requires a custom Expo development build; the current build has not been run on a physical device with granted permissions.
- Speech recognition quality and available English/Hausa/Yoruba/Igbo models depend on the device, operating-system recognizer, installed language model, microphone, and environment. Mic gain is not adjustable by this Expo module.
- Language selection changes command recognition when the locale is supported; Bible content remains English KJV and most screen labels are in English.

## Recommended acceptance checks

1. Run `pnpm test:integration`; expect both real-service checks to pass.
2. In a dedicated non-production database, separately test signup/login/logout with a non-sensitive test account.
3. Build the configured Expo development build, install on a physical device, grant both microphone and speech-recognition permissions, and test voice commands from onboarding, language switch/fallback, continuous KJV playback, and spoken Stop mid-narration with VoiceOver/TalkBack.

Never debug a TLS issue by disabling certificate validation or broadly allowing every source address. Do not publish API keys, connection strings, or test-account passwords.
