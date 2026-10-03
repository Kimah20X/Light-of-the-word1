import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import * as Speech from "expo-speech";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { colors } from "@/components/light-ui";
import { BIBLE_BOOKS } from "@/lib/bible-catalog";
import { formatReference, useAppState } from "@/lib/app-state";
import { moveChapterReference, parseVoiceCommand, READING_SPEEDS, shouldResumeAfterPause, VOICE_LISTENING_WINDOW_MS } from "@/lib/voice-command";
import { useBibleChapter } from "@/lib/use-bible-chapter";
import { chooseRecognitionLocale, getVoiceHelp, getVoiceLocale, languageChangeAnnouncement, normalizeSpeechTranscript } from "@/lib/voice-language";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RESTART_AFTER_SILENCE_MS = 700;
const CONTINUOUS_COMMANDS = new Set(["stop", "stop reading", "pause", "pause reading", "stop playback", "stop the bible", "daina", "tsaya", "duro", "kwusi"]);
const COMMAND_HINTS = [
  "Open Bible", "Open John chapter 3 verse 16", "next verse", "previous verse", "next chapter", "previous chapter",
  "read this chapter", "stop reading", "repeat this verse", "save this verse", "where am I", "help", "English", "Hausa", "Yoruba", "Igbo",
  "Bude Bible", "Karanta", "Aya ta gaba", "Aya ta baya", "Babi na gaba", "Babi na baya", "Tsaya", "Daina", "Maimaita ayar", "Ajiye wannan aya", "Taimako",
  "Ṣí Bibeli", "Ka", "Ẹsẹ ti o tẹle", "Ẹsẹ ti o ti kọja", "Orí tí ó tẹ̀lé", "Dúró", "Tun ẹsẹ yii ka", "Fi ẹsẹ yìí pamọ́", "Ìrànlọ́wọ́",
  "Mepee Bible", "Gụọ", "Amaokwu ọzọ", "Amaokwu gara aga", "Isiakwụkwọ ọzọ", "Kwụsị", "Gụọ amaokwu a ọzọ", "Chekwaa amaokwu a", "Enyemaka",
  ...BIBLE_BOOKS.map((book) => book.name),
];

export function FloatingVoiceCommand() {
  const {
    reference, setReference, saveCurrentBookmark, preferences, updatePreferences, setOnboardingComplete,
    voiceControllerActive, setVoiceControllerActive, continuousReading, startContinuousReading, stopContinuousReading,
  } = useAppState();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const viewport = useWindowDimensions();
  const shellWidth = Math.min(viewport.width, 390);
  const horizontalOffset = Math.max(18, (viewport.width - shellWidth) / 2 + 18);
  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognitionLocale, setRecognitionLocale] = useState(getVoiceLocale(preferences.language));
  const [englishRecognitionFallback, setEnglishRecognitionFallback] = useState(false);
  const bible = useBibleChapter();
  const sessionDeadline = useRef(0);
  const continuousReadingRef = useRef(continuousReading);
  continuousReadingRef.current = continuousReading;
  const receivedFinalResult = useRef(false);
  const permissionGranted = useRef(false);
  const recognitionAllowed = useRef(false);
  const starting = useRef(false);
  const recognizerActive = useRef(false);
  const supportedLocalesRef = useRef<string[]>([]);
  const directStartRequested = useRef(false);
  const latestBeginVoiceWindow = useRef<() => void>(() => undefined);
  const lastLanguage = useRef(preferences.language);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (restartTimer.current) clearTimeout(restartTimer.current);
    if (windowTimer.current) clearTimeout(windowTimer.current);
    restartTimer.current = null;
    windowTimer.current = null;
  }, []);

  const closeController = useCallback(() => {
    sessionDeadline.current = 0;
    clearTimers();
    ExpoSpeechRecognitionModule.abort();
    stopContinuousReading();
    Speech.stop();
    recognitionAllowed.current = false;
    starting.current = false;
    recognizerActive.current = false;
    setListening(false);
    setVoiceControllerActive(false);
  }, [clearTimers, setVoiceControllerActive, stopContinuousReading]);

  const moveChapter = useCallback((delta: number) => {
    const result = moveChapterReference(reference, delta === -1 ? -1 : 1);
    if (result.moved) setReference(result.reference);
    return result;
  }, [reference, setReference]);

  const startRecognizer = useCallback(async () => {
    if (starting.current || recognizerActive.current || listening) return;
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      sessionDeadline.current = 0;
      clearTimers();
      setListening(false);
      recognitionAllowed.current = false;
      const detail = "Speech recognition is not available in this app session. Install the LIGHT OF THE WORD native development build and enable microphone and speech access in device Settings.";
      setMessage(detail);
      AccessibilityInfo.announceForAccessibility(detail);
      return;
    }

    starting.current = true;
    try {
      if (Platform.OS !== "web" && !permissionGranted.current) {
        const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!permission.granted) {
          sessionDeadline.current = 0;
          clearTimers();
          setListening(false);
          recognitionAllowed.current = false;
          const detail = "Microphone and speech access are needed. Enable both permissions in device Settings, then activate Listen again.";
          setMessage(detail);
          AccessibilityInfo.announceForAccessibility(detail);
          return;
        }
        permissionGranted.current = true;
      }

      let supportedLocales = supportedLocalesRef.current;
      if (Platform.OS !== "web" && !supportedLocales.length) {
        try {
          const result = await ExpoSpeechRecognitionModule.getSupportedLocales({});
          supportedLocales = result.locales;
          supportedLocalesRef.current = supportedLocales;
        } catch {
          // Browser and some older native recognizers cannot report installed locales. Try the selected locale directly.
        }
      }
      const selected = chooseRecognitionLocale(preferences.language, supportedLocales);
      setRecognitionLocale(selected.locale);
      setEnglishRecognitionFallback(selected.usedEnglishFallback);
      recognitionAllowed.current = true;
      receivedFinalResult.current = false;
      if (!continuousReadingRef.current) Speech.stop();

      if (!sessionDeadline.current) {
        if (continuousReadingRef.current) {
          sessionDeadline.current = Number.MAX_SAFE_INTEGER;
        } else {
          sessionDeadline.current = Date.now() + VOICE_LISTENING_WINDOW_MS;
          windowTimer.current = setTimeout(() => {
            sessionDeadline.current = 0;
            clearTimers();
            ExpoSpeechRecognitionModule.abort();
            setListening(false);
            const detail = "Listening paused after one minute. Activate Listen again when you are ready.";
            setMessage(detail);
            AccessibilityInfo.announceForAccessibility(detail);
          }, VOICE_LISTENING_WINDOW_MS);
        }
      }

      const androidRecognitionServicePackage = Platform.OS === "android"
        ? ExpoSpeechRecognitionModule.getDefaultRecognitionService().packageName || undefined
        : undefined;
      recognizerActive.current = true;
      ExpoSpeechRecognitionModule.start({
        lang: selected.locale,
        interimResults: true,
        continuous: continuousReadingRef.current,
        iosTaskHint: "dictation",
        maxAlternatives: 5,
        contextualStrings: COMMAND_HINTS,
        androidRecognitionServicePackage,
        androidIntentOptions: {
          EXTRA_LANGUAGE_MODEL: "free_form",
          EXTRA_ENABLE_BIASING_DEVICE_CONTEXT: true,
          EXTRA_PROMPT: "Speak a Bible reference or command. Say Help for examples.",
        },
      });
    } catch (error) {
      sessionDeadline.current = 0;
      clearTimers();
      setListening(false);
      recognitionAllowed.current = false;
      recognizerActive.current = false;
      const code = (error as { code?: string })?.code;
      const detail = code === "ERR_REQUEST_PERMISSIONS_DENIED"
        ? "Microphone or speech-recognition permission was denied. Enable both in device Settings, then activate Listen again."
        : "Speech recognition could not start. Check that a speech-recognition service is installed and microphone access is enabled, then activate Listen again.";
      setMessage(detail);
      AccessibilityInfo.announceForAccessibility(detail);
    } finally {
      starting.current = false;
    }
  }, [clearTimers, listening, preferences.language]);

  const beginVoiceWindow = useCallback(async () => {
    clearTimers();
    sessionDeadline.current = 0;
    receivedFinalResult.current = false;
    setTranscript("");
    setMessage(`Starting voice listening in ${preferences.language}. Take your time.`);
    await startRecognizer();
  }, [clearTimers, preferences.language, startRecognizer]);
  latestBeginVoiceWindow.current = () => { void beginVoiceWindow(); };

  const announceAndListen = useCallback((spokenMessage: string, language?: string) => {
    clearTimers();
    sessionDeadline.current = 0;
    ExpoSpeechRecognitionModule.abort();
    recognizerActive.current = false;
    setListening(false);
    setMessage(spokenMessage);
    AccessibilityInfo.announceForAccessibility(spokenMessage);
    Speech.stop();
    Speech.speak(spokenMessage, {
      language: language ?? (englishRecognitionFallback && preferences.language !== "English" ? "en-US" : getVoiceLocale(preferences.language)),
      rate: preferences.speed,
      onDone: () => {
        if (voiceControllerActive && recognitionAllowed.current) latestBeginVoiceWindow.current();
      },
      onError: () => {
        if (voiceControllerActive && recognitionAllowed.current) {
          restartTimer.current = setTimeout(() => {
            restartTimer.current = null;
            latestBeginVoiceWindow.current();
          }, RESTART_AFTER_SILENCE_MS);
        }
      },
    });
  }, [clearTimers, englishRecognitionFallback, preferences.language, preferences.speed, voiceControllerActive]);

  const speakHelp = useCallback(() => announceAndListen(getVoiceHelp(englishRecognitionFallback && preferences.language !== "English" ? "English" : preferences.language)), [announceAndListen, englishRecognitionFallback, preferences.language]);

  useEffect(() => {
    if (lastLanguage.current === preferences.language) return;
    lastLanguage.current = preferences.language;
    let cancelled = false;
    void (async () => {
      let locales = supportedLocalesRef.current;
      if (!locales.length) {
        try {
          locales = (await ExpoSpeechRecognitionModule.getSupportedLocales({})).locales;
          supportedLocalesRef.current = locales;
        } catch {
          // Try the configured locale on the next activation when the recognizer cannot list its languages.
        }
      }
      const selection = chooseRecognitionLocale(preferences.language, locales);
      if (cancelled) return;
      setRecognitionLocale(selection.locale);
      setEnglishRecognitionFallback(selection.usedEnglishFallback);
      if (!voiceControllerActive) return;
      const confirmation = languageChangeAnnouncement(preferences.language, selection.usedEnglishFallback);
      setMessage(confirmation);
      AccessibilityInfo.announceForAccessibility(confirmation);
      recognizerActive.current = false;
      starting.current = false;
      ExpoSpeechRecognitionModule.abort();
      setListening(false);
      Speech.stop();
      Speech.speak(confirmation, {
        language: selection.usedEnglishFallback ? "en-US" : getVoiceLocale(preferences.language),
        rate: preferences.speed,
        onDone: () => { if (voiceControllerActive) latestBeginVoiceWindow.current(); },
      });
    })();
    return () => { cancelled = true; };
  }, [preferences.language, preferences.speed, voiceControllerActive]);

  const startContinuousPlayback = useCallback(() => {
    startContinuousReading();
    setVoiceControllerActive(true);
    setMessage(`Reading ${formatReference(reference)} and continuing through each verse. Say Stop to end.`);
    AccessibilityInfo.announceForAccessibility(`Starting continuous Bible reading at ${formatReference(reference)}. Say Stop to end.`);
    clearTimers();
    sessionDeadline.current = Number.MAX_SAFE_INTEGER;
    receivedFinalResult.current = false;
    recognizerActive.current = false;
    starting.current = false;
    ExpoSpeechRecognitionModule.abort();
    setListening(false);
    restartTimer.current = setTimeout(() => {
      restartTimer.current = null;
      if (recognitionAllowed.current) void startRecognizer();
    }, 250);
  }, [clearTimers, reference, setVoiceControllerActive, startContinuousReading, startRecognizer]);

  const runCommand = useCallback((input: string) => {
    const intent = parseVoiceCommand(input);
    if (!intent) {
      announceAndListen(`I heard “${input.trim()}”, but could not match it to a command. Say Help to hear examples.`, "en-US");
      return;
    }

    switch (intent.type) {
      case "language":
        updatePreferences({ language: intent.value });
        break;
      case "openReader":
        setOnboardingComplete(true);
        router.replace("/");
        announceAndListen("Opening the Bible Reader.", "en-US");
        return;
      case "open":
        setReference(intent.reference);
        announceAndListen(`Opening ${formatReference(intent.reference)}.`);
        return;
      case "nextVerse": {
        if (bible.verseCount > 0 && reference.verse >= bible.verseCount) {
          const result = moveChapter(1);
          announceAndListen(result.moved
            ? `That was the last verse. Moving to ${result.reference.book} chapter ${result.reference.chapter}, verse 1.`
            : "You are at the last verse in Revelation. There is no next verse.");
          break;
        }
        const next = { ...reference, verse: reference.verse + 1 };
        setReference(next);
        announceAndListen(`Moved to ${formatReference(next)}.`);
        break;
      }
      case "previousVerse": {
        const previous = { ...reference, verse: Math.max(1, reference.verse - 1) };
        setReference(previous);
        announceAndListen(`Moved to ${formatReference(previous)}.`);
        break;
      }
      case "nextChapter": {
        const result = moveChapter(1);
        announceAndListen(result.moved ? `Moved to ${result.reference.book} chapter ${result.reference.chapter}.` : "You are at the final chapter in Revelation.");
        break;
      }
      case "previousChapter": {
        const result = moveChapter(-1);
        announceAndListen(result.moved ? `Moved to ${result.reference.book} chapter ${result.reference.chapter}.` : "You are at Genesis chapter 1, the first chapter in the Bible.");
        break;
      }
      case "read":
      case "readChapter":
      case "repeat":
        if (!bible.verseText && !bible.isLoading) {
          announceAndListen("This verse is not available to read aloud yet. Check your connection or open a saved chapter.", "en-US");
          break;
        }
        if (intent.type === "readChapter") setReference({ ...reference, verse: 1 });
        startContinuousPlayback();
        break;
      case "pause":
        sessionDeadline.current = 0;
        clearTimers();
        ExpoSpeechRecognitionModule.abort();
        setListening(false);
        stopContinuousReading();
        Speech.stop();
        announceAndListen("Bible reading stopped. Say Read to continue from this verse.", "en-US");
        break;
      case "bookmark":
        announceAndListen(saveCurrentBookmark()
          ? `Saved ${formatReference(reference)} to Bookmarks for later reading.`
          : `${formatReference(reference)} is already saved in Bookmarks.`);
        break;
      case "startChapter":
        setReference({ ...reference, verse: 1 });
        announceAndListen(`Moved to the start of ${reference.book} chapter ${reference.chapter}, verse 1.`);
        break;
      case "currentReference":
        announceAndListen(`You are at ${formatReference(reference)}.`);
        break;
      case "closeVoice":
        closeController();
        AccessibilityInfo.announceForAccessibility("Voice controller closed.");
        break;
      case "listen":
        void beginVoiceWindow();
        break;
      case "home":
        router.navigate("/");
        announceAndListen("Opening Home.", "en-US");
        break;
      case "settings":
        router.navigate("/(tabs)/settings");
        announceAndListen("Opening Settings.", "en-US");
        break;
      case "bookmarks":
        router.navigate("/(tabs)/bookmarks");
        announceAndListen("Opening Bookmarks.", "en-US");
        break;
      case "profile":
        router.navigate("/profile");
        announceAndListen("Opening Profile.", "en-US");
        break;
      case "navigate":
        router.navigate("/navigate");
        announceAndListen("Opening Bible Navigation.", "en-US");
        break;
      case "login":
        router.navigate("/login");
        announceAndListen("Opening sign in.", "en-US");
        break;
      case "signup":
        router.navigate("/signup");
        announceAndListen("Opening account registration.", "en-US");
        break;
      case "fontSize":
        updatePreferences({ fontSize: intent.value === "small" ? 18 : intent.value === "medium" ? 22 : 27 });
        announceAndListen(`Reader text size set to ${intent.value}.`);
        break;
      case "autoplay":
        updatePreferences({ autoplay: intent.value });
        announceAndListen(`Automatic chapter reading turned ${intent.value ? "on" : "off"}.`);
        break;
      case "speed":
        updatePreferences({ speed: intent.value });
        announceAndListen(`Reading speed set to ${intent.value} times.`);
        break;
      case "faster":
      case "slower": {
        const currentIndex = READING_SPEEDS.indexOf(preferences.speed as (typeof READING_SPEEDS)[number]);
        const nextIndex = Math.max(0, Math.min(READING_SPEEDS.length - 1, currentIndex + (intent.type === "faster" ? 1 : -1)));
        const speed = READING_SPEEDS[nextIndex];
        updatePreferences({ speed });
        announceAndListen(`Reading speed set to ${speed} times.`);
        break;
      }
      case "help":
        speakHelp();
        break;
      default:
        break;
    }
  }, [announceAndListen, beginVoiceWindow, bible.isLoading, bible.verseCount, bible.verseText, clearTimers, closeController, moveChapter, preferences.speed, reference, saveCurrentBookmark, setOnboardingComplete, setReference, speakHelp, startContinuousPlayback, stopContinuousReading, updatePreferences]);

  useSpeechRecognitionEvent("start", () => {
    starting.current = false;
    recognizerActive.current = true;
    setListening(true);
    const status = continuousReadingRef.current
      ? "Listening for Stop while the Bible is read aloud. Say Stop to end."
      : englishRecognitionFallback && preferences.language !== "English"
        ? `Listening for spoken commands in English because this device did not list ${preferences.language} recognition.`
        : `Listening for commands in ${preferences.language}. You have one minute. Take your time and pause when you need to.`;
    setMessage(status);
    AccessibilityInfo.announceForAccessibility(status);
  });

  useSpeechRecognitionEvent("end", () => {
    starting.current = false;
    recognizerActive.current = false;
    setListening(false);
    if (!shouldResumeAfterPause(sessionDeadline.current, Date.now(), receivedFinalResult.current)) return;
    setMessage("Still here. Take your time; listening is continuing.");
    if (restartTimer.current) clearTimeout(restartTimer.current);
    restartTimer.current = setTimeout(() => {
      restartTimer.current = null;
      if (shouldResumeAfterPause(sessionDeadline.current, Date.now(), receivedFinalResult.current)) void startRecognizer();
    }, RESTART_AFTER_SILENCE_MS);
  });

  useSpeechRecognitionEvent("result", (event) => {
    const alternatives = event.results.map((result) => result.transcript.trim()).filter(Boolean);
    const heard = alternatives[0];
    if (!heard) return;
    setTranscript(heard);
    if (continuousReadingRef.current) {
      if (event.isFinal && alternatives.some((text) => CONTINUOUS_COMMANDS.has(normalizeSpeechTranscript(text).toLowerCase().replace(/[.!?]+$/, "")))) {
        receivedFinalResult.current = true;
        sessionDeadline.current = 0;
        clearTimers();
        recognizerActive.current = false;
        starting.current = false;
        ExpoSpeechRecognitionModule.abort();
        setListening(false);
        stopContinuousReading();
        Speech.stop();
        announceAndListen("Bible reading stopped. Say Read to continue from this verse.", "en-US");
      } else if (event.isFinal) {
        setMessage("Reading aloud. Say Stop at any time to end.");
      }
      return;
    }
    if (event.isFinal) {
      receivedFinalResult.current = true;
      sessionDeadline.current = 0;
      clearTimers();
      const command = alternatives.find((candidate) => parseVoiceCommand(candidate)) ?? heard;
      runCommand(command);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    starting.current = false;
    recognizerActive.current = false;
    setListening(false);
    const retryable = event.error === "no-speech" || event.error === "speech-timeout";
    if (!retryable) {
      sessionDeadline.current = 0;
      clearTimers();
    }
    const detail = event.error === "not-allowed"
      ? "Microphone or speech access was denied. Enable both permissions in device or browser Settings, then activate Listen again."
      : event.error === "language-not-supported"
        ? "This device does not support the selected recognition language. Choose another language in Settings, then activate Listen again."
        : retryable
          ? "No words yet. Take your time; listening will continue."
          : `Speech recognition is unavailable right now (${event.error}). Check that a speech service is installed and microphone access is enabled, then activate Listen again.`;
    setMessage(detail);
    if (!retryable) {
      if (continuousReadingRef.current) stopContinuousReading();
      recognitionAllowed.current = false;
      AccessibilityInfo.announceForAccessibility(detail);
    }
  });

  useEffect(() => {
    if (voiceControllerActive) {
      if (directStartRequested.current) {
        directStartRequested.current = false;
        return;
      }
      latestBeginVoiceWindow.current();
      return;
    }
    sessionDeadline.current = 0;
    clearTimers();
    recognizerActive.current = false;
    starting.current = false;
    ExpoSpeechRecognitionModule.abort();
    setListening(false);
    return () => {
      sessionDeadline.current = 0;
      clearTimers();
      ExpoSpeechRecognitionModule.abort();
    };
  }, [clearTimers, voiceControllerActive]);

  const stopListening = () => {
    if (continuousReading) {
      stopContinuousReading();
      Speech.stop();
      sessionDeadline.current = 0;
      clearTimers();
      recognizerActive.current = false;
      starting.current = false;
      ExpoSpeechRecognitionModule.abort();
      setListening(false);
      const status = "Reading stopped. Listening for your next spoken command.";
      setMessage(status);
      AccessibilityInfo.announceForAccessibility(status);
      restartTimer.current = setTimeout(() => {
        restartTimer.current = null;
        if (voiceControllerActive) latestBeginVoiceWindow.current();
      }, 250);
      return;
    }
    if (!listening) {
      latestBeginVoiceWindow.current();
      return;
    }
    sessionDeadline.current = 0;
    clearTimers();
    recognizerActive.current = false;
    starting.current = false;
    ExpoSpeechRecognitionModule.stop();
    const status = "Listening stopped. I will process any final words. Activate Listen again when you are ready to speak.";
    setMessage(status);
    AccessibilityInfo.announceForAccessibility(status);
  };

  return (
    <>
      {!voiceControllerActive ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start voice controller and listen for a command"
          accessibilityHint="Starts listening immediately. Say Open Bible, a Bible reference, or Help for spoken examples. Voice commands are the primary way to use this app."
          onPress={() => { directStartRequested.current = true; setVoiceControllerActive(true); void beginVoiceWindow(); }}
          style={({ pressed }) => [styles.fab, pathname === "/onboarding" && styles.onboardingFab, (pathname === "/navigate" || pathname === "/bookmarks") && styles.greenFab, pathname.includes("settings") && styles.settingsFab, pressed && styles.pressed, { right: horizontalOffset, bottom: pathname === "/onboarding" ? 200 + insets.bottom : 92 + insets.bottom }]}
        >
          <Ionicons name="mic" size={26} color={pathname === "/onboarding" || pathname.includes("settings") ? colors.tealInk : colors.amberInk} />
        </Pressable>
      ) : (
        <View accessibilityViewIsModal style={[styles.controller, { left: horizontalOffset, right: horizontalOffset, bottom: 82 + insets.bottom }]}>
          <View style={styles.controllerHeader}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, listening && styles.statusDotLive]} />
              <Text accessibilityRole="header" style={styles.controllerTitle}>{continuousReading ? "Bible reading · listening for Stop" : "Voice controller"}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close voice controller and stop listening" onPress={closeController} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <Text accessibilityLiveRegion="polite" accessibilityRole="text" style={styles.message}>
            {message || (listening ? `Listening for spoken commands in ${preferences.language}.` : "Ready for your next spoken command.")}
          </Text>
          <Text style={styles.timeHint}>{continuousReading
            ? "Bible reading continues hands-free. Say Stop or Pause to end."
            : listening
              ? `Listening in ${recognitionLocale} for up to one minute. ${englishRecognitionFallback ? "English command fallback is active. " : ""}Pauses are okay.`
              : starting.current
                ? "Connecting to the device speech service. Please wait."
                : recognitionAllowed.current
                ? "Listening is paused. Activate Listen again or say Help."
                : "Voice recognition needs a supported device speech service and microphone permission."}</Text>
          {transcript ? <Text accessibilityLiveRegion="polite" style={styles.transcript}>I heard: {transcript}</Text> : null}

          <View style={styles.controlsRow}>
            <Pressable accessibilityRole="button" accessibilityLabel={continuousReading ? "Stop Bible reading" : listening ? "Stop listening and process spoken words" : "Listen again for a spoken command"} accessibilityHint={continuousReading ? "Stops Bible speech; voice control remains available" : listening ? "Finishes the current speech attempt" : "Starts another spoken command session"} accessibilityState={{ selected: listening || continuousReading }} onPress={stopListening} style={[styles.listenButton, (listening || continuousReading) && styles.listenButtonActive]}>
              <Ionicons name={listening || continuousReading ? "stop-circle-outline" : "mic-outline"} size={21} color={listening || continuousReading ? colors.amberInk : colors.tealInk} />
              <Text style={[styles.listenButtonText, (listening || continuousReading) && styles.listenButtonTextActive]}>{continuousReading ? "Stop reading" : listening ? "Finish listening" : "Listen again"}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Hear voice command examples" accessibilityHint="Speaks command examples in the selected language, then resumes listening" onPress={speakHelp} style={styles.helpButton}>
              <Ionicons name="help-circle-outline" size={22} color={colors.amber} />
            </Pressable>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: "absolute", right: 18, bottom: Platform.OS === "web" ? 92 : 110, zIndex: 20, width: 64, height: 64, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#c88124", borderWidth: 2, borderColor: "rgba(0,0,0,0.5)", shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.32, shadowRadius: 9, elevation: 8 },
  onboardingFab: { backgroundColor: "#1d9e75", right: 20 },
  greenFab: { backgroundColor: colors.teal },
  settingsFab: { backgroundColor: colors.amber },
  pressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
  controller: { position: "absolute", zIndex: 30, maxWidth: 354, padding: 14, borderRadius: 16, borderWidth: 2, borderColor: colors.tealBright, backgroundColor: "#151918", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 14 },
  controllerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 5 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.amber },
  statusDotLive: { backgroundColor: colors.tealBright },
  controllerTitle: { color: colors.amber, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  closeButton: { minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  message: { color: colors.text, fontSize: 16, lineHeight: 23, marginTop: 2 },
  timeHint: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  transcript: { color: colors.amberSoft, fontSize: 15, lineHeight: 21, marginTop: 6 },
  controlsRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 11 },
  listenButton: { flex: 1, minHeight: 54, borderRadius: 10, backgroundColor: colors.tealBright, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  listenButtonActive: { backgroundColor: colors.amberSoft },
  listenButtonText: { color: colors.tealInk, fontSize: 16, fontWeight: "800" },
  listenButtonTextActive: { color: colors.amberInk },
  helpButton: { width: 52, height: 52, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
});
