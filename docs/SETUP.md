# Project setup

The project has two runtime parts: the Expo mobile app in `app/` and the Express API in `backend/`. The API uses MongoDB for email/password accounts and API.Bible for online KJV chapter downloads. Local bookmarks/preferences remain in the app. No credentials have been added here.

## Where to find the backend

Open the project root and then `backend/`. The Express entry point is `backend/_core/index.ts`; account endpoints are in `backend/_core/account-routes.ts`; MongoDB account/session storage is in `backend/account-auth.ts`; API.Bible is in `backend/api-bible.ts`; tRPC endpoints are in `backend/routers.ts`. See [`../backend/README.md`](../backend/README.md).

## Configure the services

For hosted development/deployment, add private variables through WebDev's secure project-secrets form. They are injected into the backend environment; a physical `backend/.env` file is not required or promised by the hosted secret manager.

For development on your own machine, the Express backend supports a private **`backend/.env`** file. Run the project scripts from the repository root. Loading order is: injected runtime environment first, then `backend/.env`, then the root `.env` for compatibility. Local files never override injected runtime values. `.gitignore` excludes root and nested `.env` files. Never commit credentials or expose database credentials/API keys in `EXPO_PUBLIC_` variables.

| Setting | Where | Purpose |
|---|---|---|
| `MONGODB_URI` | Backend secret | MongoDB Atlas/connection URI. Choose the target database in this URI or use the optional name below. |
| `MONGODB_DATABASE` | Optional backend setting | Explicit database name if not selected by the URI. |
| `APIBIBLE_API_KEY` | Backend secret only | Private API.Bible project key. |
| `APIBIBLE_BIBLE_ID` | Backend setting | Exact English KJV edition ID accessible to that API.Bible key. |
| `EXPO_PUBLIC_API_BASE_URL` | Expo client build setting for native apps | Public HTTPS origin of the deployed Express API, reachable from the phone. The hosted web preview derives the API origin automatically. |

After adding backend secrets, restart/redeploy the project. `/api/health` checks Express. The `bible.status` query reports only whether provider variables are present; it does not expose the API key. The first chapter fetch verifies the selected Bible metadata and rejects an edition not identified as English KJV. Registration/sign-in shows MongoDB configuration or connection errors until a database is reachable.

Run `pnpm test:integration` from the project root to validate actual credentials. It fetches Romans 6 through the real provider adapter and checks verse 2, then authenticates to MongoDB and pings the configured database. It does not create accounts or prove collection write permissions; registration/login still require a separate end-to-end check. Ordinary `pnpm test` skips these two network checks. No secret values are printed by these checks.

## API.Bible access, offline caching, and rights

Create an API.Bible application and store its private key as `APIBIBLE_API_KEY` on the server. Select the KJV edition in your account catalogue, confirm that it is available under that account and licensed for the planned distribution/monetization, then set its exact ID as `APIBIBLE_BIBLE_ID`. The server checks `/v1/bibles/{id}` before fetching chapter text. The app does not invent or substitute scripture when the provider is unavailable.

Chapters opened while online are cached on the device for offline reading, subject to the provider's 30-day refresh limit. A chapter not previously downloaded needs a connection for its first download. Expired provider text is not served as currently licensed content; reconnect to refresh it.

The **web preview** reports displayed scripture through API.Bible's official JavaScript FUMS tracker. API.Bible currently requires FUMS for websites, web-based interfaces, and hybrid apps with embedded web views, and exempts fully native App Store/Play Store apps that have no web components. Check the current FUMS rules again before changing the distribution model.

API.Bible identifies its Starter plan as non-commercial; its monetization examples include ads, sponsorships, subscriptions, paid access, and in-app promotions. Check the selected translation's license before release. KJV rights are territorial: Cambridge says UK Authorized Version rights are administered on behalf of the Crown, while Project Gutenberg's public-domain statement is US-specific. The project does not assume global public-domain or commercial-use rights. Sources: [API.Bible FAQ](https://api.bible/faq), [API.Bible terms](https://api.bible/terms-and-conditions), [Bible catalogue guide](https://docs.api.bible/guides/bibles/), [FUMS help](https://care.api.bible/article/417-understanding-fums), [Cambridge rights and permissions](https://www.cambridge.org/universitypress/bibles/about/rights-and-permissions), and [Project Gutenberg eBook 10](https://www.gutenberg.org/ebooks/10).

## Authentication and data scope

The Express API validates email/password requests. Passwords use per-account scrypt salts; MongoDB stores account records plus hashed, expiring, revocable sessions. Native session tokens are stored in Expo SecureStore; the web uses HttpOnly cookies. Validation, email normalization, rate limits, and generic incorrect-credential responses are included. The existing Manus OAuth/SQL metadata path remains intact and separate.

Email verification, password-reset delivery, and cloud sync for reading history/bookmarks are not included. A successful login does not imply those features exist; reading and bookmarks remain device-local.

## Speech-recognition build requirement

The floating microphone now supports one-utterance platform speech recognition and typed fallback. Native recognition requires a custom Expo development build; Expo Go does not bundle this native module. Permissions are in `app.config.ts`. Build/install a development client with EAS or the appropriate local Android/iOS toolchain. Follow [`VOICE_AND_COMMANDS.md`](VOICE_AND_COMMANDS.md) for OS/browser permission prompts and recognition limitations.

## `.vpc` files

`.vpc` is not a standard Bible-text interchange format and may refer to unrelated vendor-specific data. This app does not import or interpret `.vpc`. To assess one, identify the software/version that created it and provide the file; also check the translation's rights separately.
