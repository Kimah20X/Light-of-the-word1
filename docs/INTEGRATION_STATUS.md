# Integration status

**Last checked:** 2026-10-02. This records observed checks, not guarantees about a later deploy.

## Verified working

- WebDev Express health endpoint responds successfully.
- The running WebDev API reports API.Bible configured; a direct `bible.chapter` request returned Romans 6 with 23 verses, and verse 2 matched the expected KJV text.
- A prior standalone `pnpm test:integration` API.Bible test passed. The most recent standalone repeat timed out while checking edition metadata; the separate request to the running WebDev API still returned real KJV text. This points to an intermittent environment/network difference, not proof of uninterrupted provider access.
- Bible references, including number-word references such as `John three sixteen` and spoken book ordinals such as `First Corinthians thirteen four`, are parsed locally and have unit tests.
- Common short navigation, reading, speed, help, and save-bookmark commands have parser coverage. Spoken save is idempotent and targets the displayed verse. Chapter stepping is tested across book boundaries.
- EAS build configuration parses through Expo; no environment files are tracked.
- Local automated checks: 29 tests passed; 3 integration/environment-dependent tests skipped in the normal suite; TypeScript, lint, Expo dependency checks, Express bundle, and static web export passed.

## Not verified / currently blocked

- **MongoDB:** the live authenticated ping fails during TLS connection negotiation both in the standalone test and in the running account API (a read-only login probe returned HTTP 503). Do not treat password signup/login as available until a fresh ping succeeds. The root cause is not established; review Atlas Network Access, cluster state, credentials/URI encoding, and server egress. TLS certificate verification has not been disabled.
- An actual signup/account write, session login, and logout against MongoDB have not been tested because connectivity is failing.
- Native speech recognition requires a custom Expo development build. A native EAS build and real-device permission/recognition test were not run as part of these checks; web and unit tests do not prove device behavior.
- The existing OAuth logout test remains skipped in the ordinary test suite. The Manus OAuth login option has been preserved in the login screen, but this run did not validate the full external OAuth flow.

## Safe next check

After correcting Atlas/network access, run `pnpm test:integration` from the repository root more than once if the provider request times out. Only after its MongoDB ping passes, perform a separate account signup/login/logout smoke test in a dedicated non-production database. Never solve a TLS handshake failure by disabling certificate checks or using an unrestricted network allow-list as a default.
