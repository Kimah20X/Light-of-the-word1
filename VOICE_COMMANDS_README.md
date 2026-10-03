# LIGHT OF THE WORD — Voice Commands Readme

This app is designed for **voice-first Bible use**. The voice controller has **no “Type a command” or keyboard fallback**. Speech is interpreted locally by the app after the device/browser recognizer returns a transcript.

## Start talking

1. On the welcome screen, find the accessible **“Start voice controller and listen for a command”** microphone button. Activate it once; listening starts immediately.
2. Allow microphone and speech-recognition permissions when asked.
3. Say a command below at a natural pace. You may pause; the controller gives you up to one minute to speak, then you can activate **Listen again**.
4. Say **“Help”** at any time to hear examples in the selected command language.
5. The voice controller stays available while you read. During spoken Bible narration, say **“Stop”** or **“Pause”** to interrupt it.

**On onboarding:** “Open Bible” takes you to the Reader. Voice navigation can open references and Settings before or after onboarding.

## Bible references

Say **“Open”**, **“Read”**, **“Show me”**, **“Go to”**, **“Navigate to”**, **“Turn to”**, **“Take me to”**, **“Jump to”**, or **“Find”**, followed by a book and reference. The prefix is optional for an unambiguous reference.

- `Open Romans 6`
- `Romans 6:2`
- `Open John chapter 3 verse 16`
- `John three sixteen`
- `John chapter three verse sixteen`
- `Open Psalm twenty-three`
- `Find First Corinthians thirteen four`
- `First John one three`

The catalogue includes all 66 KJV books, common book names, and spoken ordinals such as **First**, **Second**, and **Third**. Chapter/verse numbers may be numeric (`John 3:16`) or spoken as words (`John three sixteen`). If a result is unclear, say **“Help”**, then repeat the reference with its chapter and verse.

## Read, move, and listen

| Action | Say any of these |
|---|---|
| Start or resume continuous read-aloud | `Read`; `Resume`; `Play`; `Start reading`; `Keep reading`; `Continue reading`; `Read aloud`; `Read this passage` |
| Read the selected chapter from its first verse | `Read this chapter`; `Play this chapter` |
| Stop read-aloud but keep voice control available | `Stop`; `Stop reading`; `Pause`; `Pause reading`; `Stop playback`; `Stop the Bible` |
| Repeat from the selected verse and continue reading | `Repeat`; `Repeat this verse`; `Repeat current verse`; `Repeat this passage`; `Say that again`; `Read that again`; `Again` |
| Go forward one verse | `Next verse`; `Next`; `Forward`; `Another verse`; `Advance the verse`; `Skip the verse`; `Move to the next verse` |
| Go back one verse | `Previous verse`; `Previous`; `Back`; `Rewind`; `Go back one verse`; `Move to the previous verse` |
| Go to the next chapter | `Next chapter`; `Move to the next chapter`; `Go forward one chapter` |
| Go to the previous chapter | `Previous chapter`; `Go back one chapter`; `Move to the previous chapter` |
| Go to the first verse in the open chapter | `Start of this chapter`; `Beginning of this chapter`; `First verse of this chapter` |
| Hear the current reference | `Where am I?`; `What verse am I on?`; `What passage am I on?`; `What is the current reference?` |

Continuous reading advances verse by verse across chapter and book boundaries until you say **Stop/Pause**, use a visible stop control, or the Bible ends. If a required chapter has not been fetched or cached, the app stops and explains that the verse is unavailable; it does not invent Bible text.

## Save a verse

Voice-saving is safe and idempotent: it adds the **currently displayed verse** to device-local Bookmarks and never removes an existing bookmark.

- `Bookmark this verse`
- `Bookmark`
- `Save this verse`
- `Save current verse`
- `Bookmark current verse`
- `Mark this verse`
- `Add bookmark`
- `Add this verse to bookmarks`
- `Save my place`

The Reader's separate bookmark control may still be used to toggle a saved item off.

## App navigation

| Destination/action | Say |
|---|---|
| Reader | `Open Bible`; `Read the Bible`; `Open Bible Reader` |
| Home | `Home`; `Go home`; `Return to home` |
| Navigate | `Open Navigate`; `Navigate screen`; `Show Navigate` |
| Bookmarks | `Bookmarks`; `Open my bookmarks`; `Show bookmarks` |
| Settings | `Settings`; `Open settings`; `Show settings` |
| Profile | `Profile`; `Open profile`; `Show profile` |
| Sign in | `Sign in`; `Log in`; `Login`; `Open login` |
| Create account | `Sign up`; `Signup`; `Register`; `Create account`; `Open signup` |
| Close the voice controller | `Close voice controller`; `Exit voice assistant`; `Dismiss microphone`; `Stop listening` |
| Restart listening | `Listen`; `Listen again`; `Start listening`; `Resume listening`; `Listen for commands` |

## Settings by voice

- Change command language: `Change language to English`; `Switch to Hausa`; `Speak in Yoruba`; `Use Igbo`.
- Set reading speed: `Faster`; `Increase speed`; `Speed up`; `Read faster`; `Slower`; `Decrease speed`; `Slow down`; or `Set speed to 1.25 times`.
- Set reader font: `Set reader text size to small`; `Change font size to medium`; `Large`; `Make text bigger`; `Make font smaller`.
- Automatic chapter preference: `Turn auto-play on`; `Turn auto-play off`; `Enable autoplay`; `Disable autoplay`.

The language choice selects the **voice-command recognition locale when available**. English, Hausa, Yoruba, and Igbo commands include basic localized examples below. Bible content is the **English KJV**, and most screen labels remain in English; selecting a command language does not translate the KJV or all app screens.

### Localized command examples

Speech support varies by device. These are phrases the local parser recognizes after receiving a transcript; diacritic marks may be omitted by the recognizer.

| English action | Hausa | Yorùbá | Igbo |
|---|---|---|---|
| Open Bible | `Bude Bible` | `Ṣí Bibeli` | `Mepee Bible` |
| Read | `Karanta` | `Ka` | `Gụọ` |
| Next verse | `Aya ta gaba` | `Ẹsẹ ti o tẹle` | `Amaokwu ọzọ` |
| Previous verse | `Aya ta baya` | `Ẹsẹ ti o ti kọja` | `Amaokwu gara aga` |
| Next chapter | `Babi na gaba` | `Orí tí ó tẹ̀lé` | `Isiakwụkwọ ọzọ` |
| Previous chapter | `Babi na baya` | `Orí tí ó ti kọjá` | `Isiakwụkwọ gara aga` |
| Stop / pause | `Daina` / `Tsaya` | `Dúró` | `Kwụsị` |
| Repeat | `Maimaita ayar` | `Tun ẹsẹ yii ka` | `Gụọ amaokwu a ọzọ` |
| Save this verse | `Ajiye wannan aya` | `Fi ẹsẹ yìí pamọ́` | `Chekwaa amaokwu a` |
| Help | `Taimako` | `Ìrànlọ́wọ́` | `Enyemaka` |
| Change language | `Canza harshe zuwa Hausa` | `Yi ede pada si Yoruba` | `Gbanwee asusu gaa na Igbo` |

## What to do when it does not hear you

1. Say **“Listen again”** or activate the accessible **Listen again** button.
2. Check the browser/device's microphone permission. On iOS, enable both **Microphone** and **Speech Recognition** for LIGHT OF THE WORD. On Android, confirm a system speech-recognition service is installed and selected.
3. In Settings, choose a command language with a recognizer model available on the device. If the app can list available locales and the chosen non-English locale is absent, it falls back to English commands and announces this. Say **“Change language to English”** if needed.
4. For low-volume speech, move closer to the device microphone, reduce background noise, and try a headset or close microphone.
5. If the error says the native module is unavailable, install the custom development build described below—not Expo Go.

Recognition accuracy depends on the device, operating system, microphone, installed speech service/language model, distance, and background noise. The current Expo speech-recognition module does **not** expose a reliable application-level mic-gain or “sensitivity” dial. This implementation supplies Bible/command vocabulary hints, requests up to five alternative transcripts, uses the device-default Android recognizer, and gives a pause-tolerant listening window; none of those can guarantee accuracy on every phone.

The operating-system/browser speech service may process audio under its own privacy policy. The app's own backend does not receive microphone recordings or command transcripts. Automatic always-on wake words are not used; a deliberate mic activation starts listening.

## Required native build

Expo Go does not include the native `expo-speech-recognition` module. The app includes `expo-dev-client` and an EAS `development` profile so you can build an installable development app. From the repository root:

```bash
pnpm install
npx eas-cli build --profile development --platform android
# or, for an iOS development build:
npx eas-cli build --profile development --platform ios
```

If building locally rather than with EAS, use `npx expo run:android` or `npx expo run:ios`; do not run `expo prebuild --clean` if you need to preserve locally maintained native folders. Install the development build on a physical phone, grant permissions, and test these acceptance steps:

1. From a fresh onboarding session, activate the microphone and say **“Help”**.
2. Say **“Open Bible”**; verify the Reader opens.
3. Say **“Change language to Hausa”**; confirm the app reports the selected recognition language or English fallback, then try **“Aya ta gaba”** if Hausa is installed.
4. Say **“Open John chapter 3 verse 16”**, then **“Save this verse”**; verify it appears in Bookmarks.
5. Say **“Read”**, wait for narration to start, then interrupt mid-verse with **“Stop”**.
6. Test with VoiceOver/TalkBack: mic start, listening state, transcript, button labels, and error/retry instructions must be announced.

For backend secrets, offline reading, API.Bible, and MongoDB setup, see [`docs/SETUP.md`](docs/SETUP.md). For the current status of real-provider checks, see [`docs/INTEGRATION_STATUS.md`](docs/INTEGRATION_STATUS.md).
