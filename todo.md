# LIGHT OF THE WORD — UI refinement

This Expo app's existing router and local state are preserved. The visual shell and primary screens now follow the supplied Figma reference at its 390px mobile frame: pure-black background, warm amber and teal accents, the supplied Bible illustration and vector mark, compact app header, square floating microphone, and centered teal selected-tab tile.

## Completed

- [x] Reworked first-run onboarding to use the actual Figma composition, local Bible artwork, language shortcut, amber start action, and accessible controls.
- [x] Matched Reader typography and verse-card treatment while retaining local reference controls, verse/chapter navigation, TTS, repeat, bookmark, reading-speed controls, and command-sheet access.
- [x] Matched Navigate search and two-column Old/New Testament book tiles while retaining the catalog, chapter/verse selection, and direct reference parser.
- [x] Refined Bookmarks, Settings, Profile, Login, and Signup within the same black/amber/teal system; account paths remain reachable through Settings/Profile.
- [x] Kept local bookmarks/preferences and stated unsupported preview features honestly.
- [x] Checked all project routes at a 390×844 viewport; verified onboarding-to-reader navigation and checked web export.

## Tests and build

Final checks: `pnpm test`, `pnpm check`, `pnpm lint`, `npx expo install --check`, and `npx expo export --platform web`.

## Preview scope

The scaffold does not include the complete offline KJV JSON, account authentication/synchronization integration, or platform speech recognition. Only a few KJV verses are bundled as preview samples. Other verse references are not fabricated; bookmark/preferences storage remains local, and voice-style commands can be typed into the command sheet. English, Hausa, Yoruba, and Igbo selections are saved locally, but only English UI copy is currently bundled.
