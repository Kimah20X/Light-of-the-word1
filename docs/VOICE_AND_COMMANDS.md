# Speech and voice commands

The app has two separate speech features; **speaking Bible text aloud is not the same as listening to commands**.

## 1. Read-aloud (text-to-speech)

`expo-speech` turns the currently available verse text into audio using the device/browser's installed voice. Use the Reader's play button to start and pause, Repeat to speak the same verse again, and the speed controls or Settings to change the rate. The current rate choices are 0.75×, 1×, 1.25×, and 1.5×.

Text-to-speech itself does not require an API key or the microphone. The words must be available first: a verse fetched from API.Bible or a sample bundled for preview can be read aloud. Missing verses cannot be spoken. Voice choice and Hausa pronunciation vary by device; iOS devices may also be silent when the hardware silent mode is on. Android pause is implemented as stop because Expo Speech does not support pause/resume on Android.

## 2. Speak a command (speech recognition)

The floating microphone opens the global command sheet. **Speak a command** requests microphone and speech-recognition permission, listens for one utterance, then passes the final transcript to the same on-device parser used by the text box. When the browser or platform does not support recognition, the text-entry path remains available.

Speech recognition is provided by the browser/OS service rather than our Express server. A provider may need internet access and may process audio under its own privacy policy; this app does not upload raw recordings to its backend. Offline recognition is not guaranteed. Hausa recognition depends on the speech service having a suitable Hausa locale/model installed.

### Commands currently recognized by the parser

| Purpose | Examples |
|---|---|
| Open a reference | `Open Romans 6`, `Open John 3:16` |
| Move reading position | `Next verse`, `Previous verse`, `Next chapter`, `Previous chapter` |
| Read controls | `Read`, `Pause`, `Resume`, `Repeat` |
| Local bookmark | `Bookmark this verse`, `Save this verse` |
| App navigation | `Home`, `Settings`, `Bookmarks`, `Profile` |
| Reading rate | `Faster`, `Slower`, `Change speed to 1.25` |

Recognition quality varies; review the displayed transcript and retry or type the command if the service heard the reference incorrectly. Commands are local intents. They do not send a conversation or scripture question to an AI service.

## Native setup you need to do

1. Keep the Expo config plugin and permissions in `app.config.ts` as checked in.
2. A native speech-recognition module is not included in Expo Go. Build and install a **custom Expo development build** after fetching dependencies and app config: use EAS development builds, or locally run `npx expo run:android` / `npx expo run:ios` on the corresponding development machine.
3. On the first microphone tap, grant both microphone and speech-recognition access. If denied, enable them in the phone's Settings and reopen the app.
4. Test `Open Romans 6` and `Next verse` on the actual target phone. Confirm the OS speech service/locale is available; type commands remain the fallback.
5. For the web preview, use a browser with Web Speech API recognition support and grant its site microphone permission. Web browser support is not uniform.

Only runtime build/device setup remains for native speech. No speech API credential is required for OS-based recognition.
