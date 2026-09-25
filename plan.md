# Implementation plan

## Approved direction

Integrate API.Bible behind the existing Express server for KJV chapter text, cache fetched chapters on device for offline use, and add MongoDB-backed email/password accounts alongside (not instead of) the existing Manus OAuth/MySQL identity flow. Preserve the Expo app architecture and its local reading state. Provider and database secrets will be configured by the user after code delivery.

## Work completed

1. Add the server-only API.Bible client, canonical book-ID mapping and chapter validation.
2. Parse API.Bible verse-span HTML, return chapter data and FUMS v3 view tokens, and show provider errors without fabricating text.
3. Cache received chapters in AsyncStorage and present cached content offline; the Reader reports usage from the web preview.
4. Add Mongo account and expiring/revocable session collections with indexes, scrypt-salted password hashes, email normalization, and Express register/login/me/logout routes.
5. Wire the existing login, signup, profile, and Settings account entry points to the new routes; keep the OAuth flow intact.
6. Add unit tests and validate with project tests, TypeScript, lint, Expo SDK checks, web export, and backend build.

## Deferred until configuration is provided

- A live connection to MongoDB, including end-to-end database account operations.
- A live API.Bible KJV chapter fetch. The API key and exact permitted Bible/edition ID are still required.
- Cloud synchronization, email verification, password-reset email delivery, and speech recognition; these are not represented as implemented.
- Full KJV offline availability before the user has downloaded chapters. API.Bible policy requires cached content to be refreshed at least every 30 days; the app marks expired chapters and refreshes when online.

See [docs/SETUP.md](docs/SETUP.md) for the precise required variables, account/data behavior, and Bible licensing/FUMS guidance.
