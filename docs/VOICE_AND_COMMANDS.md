# Speech and voice commands

The app has two separate speech features: **the reader speaks Bible text aloud**, and **the voice controller listens for app commands**. The floating microphone starts listening directly; there is no separate command pop-up to open first.

## Voice-first controller

Tap the floating microphone once to start listening. The controller remains visible above the tab bar and shows the listening state, transcript, and response. It listens for up to one minute, tolerates pauses, and resumes after short silence while waiting for a final command. After a command, it speaks a brief confirmation and resumes listening. Say **“Help”** or tap the help button to hear command examples. Use **Finish listening** to end the current attempt, **Listen again** to restart, **Type a command** for the text fallback, or **Close** to stop the controller.

The controller announces when listening starts and gives spoken feedback for recognized commands, errors, navigation, and unsupported passages. Its status and transcript are also exposed to screen readers. First-time microphone/speech permission is requested after tapping the mic. A denied permission leaves typed commands available.

## 1. Read-aloud (text-to-speech)

`expo-speech` turns the currently available verse text into audio using the device/browser's installed voice. Use the Reader's play button or say **Read**/**Resume** to start. Say **Pause** to stop and **Repeat** to speak the same verse again. The speed controls, Settings, or voice commands can change the rate. The available rates are 0.75×, 1×, 1.25×, and 1.5×.

Text-to-speech does not require an API key or microphone. The words must be available first: a verse fetched from API.Bible or a locally cached chapter can be read aloud. If a verse has not been downloaded and the provider is not configured, the app explains that the text is unavailable instead of inventing scripture. Voice choice and Hausa pronunciation vary by device; Android pause is implemented as stop because Expo Speech does not support pause/resume on Android.

## 2. Speak a command (speech recognition)

Speech recognition is provided by the browser/OS service rather than the Express server. A provider may need internet access and may process audio under its own privacy policy; this app does not upload raw recordings to its backend. Offline recognition is not guaranteed. Hausa recognition depends on the speech service having a suitable Hausa locale/model installed. Browser support also varies.

### Commands currently recognized

| Purpose | Examples |
|---|---|
| Open Reader or a reference | `Open Bible`, `Read the Bible`, `Open Romans 6`, `John 3:16`, `John chapter three verse sixteen`, `John three sixteen`, `First Corinthians thirteen four`, `Psalm twenty-three` |
| Move reading position | `Next verse`, `Move to the next verse`, `Previous verse`, `Next chapter`, `Go to the previous chapter` |
| Read controls | `Read`, `Read this passage`, `Pause`, `Resume`, `Repeat`, `Say that again` |
| Local bookmark | `Bookmark this verse`, `Save this verse`, `Mark this verse`, `Save my place`, `Add bookmark` |
| App navigation | `Home`, `Go home`, `Open my bookmarks`, `Show settings`, `Profile` |
| Reading rate | `Faster`, `Speed up`, `Slower`, `Slow down`, `Set speed to 1.25 times` |
| Spoken instructions | `Help`, `Show commands`, `What commands can I say?` |

Recognition quality varies. The controller displays the transcript and gives a spoken confirmation so the reader can tell what it heard. If the reference was misheard, try again or use the keyboard button. Commands are local app actions; they do not send a conversation or scripture question to an AI service.

Save/bookmark commands add the **currently displayed verse** to the device-local Bookmarks list for later reading. Repeating the command confirms it is already saved; it never removes the verse. The Reader's bookmark button remains a separate toggle for adding/removing a saved verse.

## Native setup you need to do

1. Keep the Expo speech-recognition config plugin and permission descriptions in `app.config.ts`.
2. The native speech-recognition module is not included in Expo Go. Build and install a **custom Expo development build** using EAS development builds or the appropriate local Android/iOS toolchain.
3. On the first microphone tap, grant microphone and speech-recognition access. If denied, enable the permissions in the phone's Settings and reopen the app.
4. Test `Open Romans 6`, `Next verse`, and `Help` on the target phone. Confirm the OS speech service and language are available; typed commands remain the fallback.
5. In the web preview, use a browser with speech recognition support and grant microphone permission for the site.

No speech API credential is required for OS-based recognition.

## Technical behavior

The direct-listening session is capped at one minute to avoid leaving the microphone running indefinitely. Brief silence causes the controller to restart recognition while that session remains active; a finalized utterance is parsed once, then the spoken confirmation completes before listening resumes. Use the visible stop and close controls to end listening sooner. The operating system or browser may impose its own recognition time limits.

Read-aloud availability follows the KJV provider/cache setup. A first-time chapter download requires internet; once fetched, eligible chapters are stored locally for offline reading subject to the provider's refresh window. See [`SETUP.md`](SETUP.md).

The voice parser remains local and supports direct references with numeric or spoken number words, common spoken ordinal books (for example, “First Corinthians”), and explicit app commands. Verse movement advances to the next chapter when the final numbered verse is known, while chapter movement respects book boundaries. An automatic always-listening wake word is intentionally not used: it can keep a microphone active continuously and requires platform-specific background behavior. The user starts the controller with a single deliberate tap.
