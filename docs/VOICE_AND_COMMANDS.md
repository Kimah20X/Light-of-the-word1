# Voice access and speech features

For the complete current voice-command list, localized phrases, accessible workflow, permission recovery, privacy notes, and real-device acceptance checklist, see the root [`VOICE_COMMANDS_README.md`](../VOICE_COMMANDS_README.md).

## At a glance

- Voice commands are the primary interaction; the global voice controller has no typed-command/keyboard fallback.
- Activate the microphone once to begin listening. First-run mic and speech permissions must be granted.
- Spoken `Help` reads command examples; screen readers receive controller status, transcripts, button labels, and errors.
- The local parser handles KJV references, navigation, continuous playback, Stop/Pause, repeat, bookmarks, language selection, reading speed, reader font size, and app routes.
- Continuous KJV read-aloud keeps recognition active for interruption commands. Say **Stop** or **Pause**; other commands are intentionally ignored during narration.
- English, Hausa, Yoruba, and Igbo command locales are requested from the device speech service. If a supported-locale list is available and does not include the selected non-English locale, the controller announces and uses English command recognition. Availability varies by service, model, and device.
- Microphone gain/recognition sensitivity is controlled by the device/OS; Expo does not expose an app-level gain control. Bible vocabulary hints, up to five alternatives, and a pause-tolerant listening cycle can help, but cannot guarantee accuracy.
- Native recognition requires a custom Expo development build; it is not available in Expo Go.
- The KJV dataset is English: selecting a command language does not translate Bible text or all interface labels.

See [`SETUP.md`](SETUP.md) for API.Bible/MongoDB configuration and [`INTEGRATION_STATUS.md`](INTEGRATION_STATUS.md) for recent live checks.
