# Backend

This directory contains the LIGHT OF THE WORD Express server and integrations. It was renamed from the template's `server/` folder so its role is explicit.

## Entry point and files

| Path | Purpose |
|---|---|
| `_core/index.ts` | Express entry point, health endpoint, CORS, public account endpoints, API.Bible FUMS/CORS behavior, and tRPC mounting. |
| `_core/account-routes.ts` | Email/password register, login, current-account, and logout HTTP routes. |
| `account-auth.ts` | MongoDB client/collections, password hashing, account and revocable session persistence. |
| `api-bible.ts` | API.Bible KJV edition verification, chapter retrieval, reference mapping, and verse HTML parsing. |
| `routers.ts` | tRPC routes, including Bible provider status/chapter endpoints and scaffold auth/OAuth routes. |
| `db.ts`, `_core/sdk.ts`, `_core/oauth.ts` | Existing template OAuth/SQL metadata integration; this is separate from the MongoDB email-account store. |
| `storage.ts`, `_core/` | Existing scaffold storage, notifications, transcription, and runtime integrations. |

## Commands

From the repository root:

```sh
pnpm dev:server  # watch/run backend/_core/index.ts
pnpm build       # bundle backend/_core/index.ts into dist/index.js
pnpm start       # run the production bundle
```

The server reads `MONGODB_URI`, optionally `MONGODB_DATABASE`, `APIBIBLE_API_KEY`, and `APIBIBLE_BIBLE_ID` from server-side environment configuration. Details and the native API URL requirement are in `../docs/SETUP.md`. Do not store these credentials in this folder or commit a populated `.env` file.
