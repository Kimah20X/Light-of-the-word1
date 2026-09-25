# Server setup: MongoDB accounts and API.Bible

The source is wired to MongoDB and API.Bible, but no database or provider credentials have been added to this project. The user will add these after delivery. In the hosted project, use the server/runtime secrets configuration. For local development, keep values in a private local `.env` and never commit them. Only the API origin belongs in the Expo client configuration; **do not** put API keys or MongoDB credentials in `EXPO_PUBLIC_` variables.

| Setting | Where | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Server secret | MongoDB Atlas/connection URI with a database name, or connection URI |
| `MONGODB_DATABASE` | Optional server setting | Database name override when it is not encoded in the URI |
| `APIBIBLE_API_KEY` | Server secret only | Private API.Bible project key |
| `APIBIBLE_BIBLE_ID` | Server setting | Exact KJV edition/Bible ID available to that API.Bible key |
| `EXPO_PUBLIC_API_BASE_URL` | Expo client build setting for native apps | Public HTTPS base URL of the deployed Express API, reachable from the phone; the web preview derives its API host automatically |

After adding the server secrets, restart/redeploy the project. `/api/health` checks Express. `bible.status` reports whether the provider variables are present without exposing the API key. Each first chapter fetch also verifies API.Bible metadata and rejects an edition not identified as English KJV. Registration/sign-in will explain MongoDB configuration/connection failures until a database is reachable.

## API.Bible setup and licensing

Create an API.Bible application and store its private key as `APIBIBLE_API_KEY` on the server. Select the KJV edition in your API.Bible catalogue, confirm that the edition is available to your account and that its license matches your planned distribution and monetization, then set its exact ID as `APIBIBLE_BIBLE_ID`. The server checks `/v1/bibles/{id}` metadata before fetching chapters. No KJV wording is generated or substituted when the provider is unavailable.

The adapter requests chapter HTML with documented verse spans and FUMS v3 metadata. Chapters opened online are saved locally and can be read offline until the provider's 30-day cache refresh interval elapses; a previously uncached chapter still requires an internet connection for its first download. Expired provider text is not presented as currently licensed content; it must be refreshed online.

The **web preview** reports scripture views through API.Bible's official JavaScript FUMS tracker. API.Bible's current help page requires FUMS for websites, web-based interfaces, and hybrid apps with embedded web views; it exempts fully native App Store/Play Store apps that have no web components. If you add web views or otherwise change the distribution model, re-check the FUMS rules for that release.

API.Bible identifies its Starter plan as non-commercial. Its examples of monetization include ads, sponsorships, subscriptions, paid access, and in-app promotions. Check the selected translation's license before publishing or monetizing. KJV rights are territorial: Cambridge says UK Authorized Version rights are administered on behalf of the Crown, while Project Gutenberg's KJV public-domain statement is US-specific. This project does not assume global public-domain or commercial-use rights. Official sources: [API.Bible FAQ](https://api.bible/faq), [API.Bible terms](https://api.bible/terms-and-conditions), [API.Bible Bible catalogue guide](https://docs.api.bible/guides/bibles/), [API.Bible FUMS help](https://care.api.bible/article/417-understanding-fums), [Cambridge rights and permissions](https://www.cambridge.org/universitypress/bibles/about/rights-and-permissions), and [Project Gutenberg eBook 10](https://www.gutenberg.org/ebooks/10).

## Accounts and reading data

The Express API validates email/password account requests. Passwords use per-account scrypt salts; MongoDB stores account records and hashed, expiring, revocable sessions. Native session tokens are kept in Expo SecureStore; web sessions use HttpOnly cookies. Rate limiting, email normalization, and generic incorrect-credential responses are included. The existing Manus OAuth/MySQL identity path remains intact and separate.

Email verification, password-reset delivery, and cloud synchronization of reading history/bookmarks are not included. These must not be inferred from successful sign-in; Bible reading and bookmarks remain device-local.

## `.vpc` files

`.vpc` is not a standard Bible text interchange format and may refer to unrelated vendor-specific data. This implementation does not accept or interpret `.vpc` files. To assess an import, provide the actual file and the name/version of the software that created it, and confirm the included translation rights separately.
