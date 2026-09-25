# LIGHT OF THE WORD — current implementation status

## Completed

- [x] Preserved the Expo Router frontend and local AppState; the app follows the supplied Figma design direction.
- [x] Wired Reader chapter/verse lookup to a server-only API.Bible provider, with canonical KJV book mapping, verse parsing, edition metadata verification, provider errors, and FUMS metadata.
- [x] Added an AsyncStorage chapter cache for on-demand offline reading. Provider text expires after 30 days and must be refreshed; uncached chapters need an internet connection once.
- [x] Added web-preview FUMS v3 reporting for displayed provider passages.
- [x] Added MongoDB account/session collections, indexes, salted scrypt password hashing, opaque hashed session tokens, expiry/revocation, rate limiting, and validation routes.
- [x] Wired Login, Signup, Profile and Settings to real account status and account endpoints; preserved the existing Manus OAuth flow and removed auth-token/user-data console logging.
- [x] Added API.Bible and account unit tests; kept previous Bible catalog and voice-command tests.
- [x] Validated the API health route and same-project credentialed CORS with an HTTP request.
- [x] Passed 17 Vitest tests (1 existing logout test remains skipped), TypeScript, lint, Expo SDK check, Express build, and Expo web export.
- [x] Inspected the mobile-width preview and verified Login/Signup render.

## Remaining — user configuration

- [ ] Add `MONGODB_URI` as a server secret (optional `MONGODB_DATABASE` only if the URI does not select the right database).
- [ ] Create/choose an API.Bible app key and add server-only `APIBIBLE_API_KEY`.
- [ ] Check the account's access and legal terms, then set the exact English KJV edition `APIBIBLE_BIBLE_ID`.
- [ ] For a native build, set `EXPO_PUBLIC_API_BASE_URL` to the public HTTPS API origin before building the client; the web preview derives its API host automatically.
- [ ] Redeploy/restart, then test account registration/sign-in and `bible.status`/a live chapter fetch with those secrets.
- [ ] Complete deployment-specific legal, licensing, and FUMS review before distribution/monetization.

## Not implemented

- Email verification, password-reset email service, and cloud sync of local reading history/bookmarks.
- Bundling the complete KJV to the device before any download; API.Bible chapters are fetched on demand and cached.
- Speech recognition (voice-style text command entry remains; device text-to-speech is separate).
- `.vpc` import: it is not treated as a standard Bible-text interchange file.
