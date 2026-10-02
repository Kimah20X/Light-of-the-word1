import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import * as Speech from "expo-speech";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { colors } from "@/components/light-ui";
import { BIBLE_BOOKS } from "@/lib/bible-catalog";
import { formatReference, useAppState } from "@/lib/app-state";
import { moveChapterReference, parseVoiceCommand, READING_SPEEDS, shouldResumeAfterPause, VOICE_LISTENING_WINDOW_MS } from "@/lib/voice-command";
import { useBibleChapter } from "@/lib/use-bible-chapter";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RESTART_AFTER_SILENCE_MS = 900;
const VOICE_HELP = "Try: Open Bible; John three sixteen; next verse; next chapter; read continuously; say Stop to end; save my place; open my bookmarks; faster, slower; or Settings. Say Help to hear this list again. I will listen for one minute, so take your time.";

export function FloatingVoiceCommand() {
  const { reference, setReference, saveCurrentBookmark, preferences, updatePreferences, setOnboardingComplete, voiceControllerActive, setVoiceControllerActive, continuousReading, startContinuousReading, stopContinuousReading } = useAppState();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const viewport = useWindowDimensions();
  const shellWidth = Math.min(viewport.width, 390);
  const horizontalOffset = Math.max(18, (viewport.width - shellWidth) / 2 + 18);
  const [command, setCommand] = useState("");
  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [typing, setTyping] = useState(false);
  const bible = useBibleChapter();
  const sessionDeadline = useRef(0);
  const continuousReadingRef = useRef(continuousReading);
  continuousReadingRef.current = continuousReading;
  const receivedFinalResult = useRef(false);
  const permissionGranted = useRef(false);
  const recognitionAllowed = useRef(false);
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
    setListening(false);
    setTyping(false);
    setVoiceControllerActive(false);
  }, [clearTimers, setVoiceControllerActive, stopContinuousReading]);

  const moveChapter = useCallback((delta: number) => {
    const result = moveChapterReference(reference, delta === -1 ? -1 : 1);
    if (result.moved) setReference(result.reference);
    return result;
  }, [reference, setReference]);

  const startRecognizer = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      sessionDeadline.current = 0;
      clearTimers();
      setListening(false);
      setMessage("Speech recognition is unavailable here. You can type a command below.");
      setTyping(true);
      recognitionAllowed.current = false;
      return;
    }
    try {
      if (!permissionGranted.current) {
        const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!permission.granted) {
          sessionDeadline.current = 0;
          clearTimers();
          setListening(false);
          setTyping(true);
          setMessage("Microphone and speech access are needed. You can still type a command below.");
          recognitionAllowed.current = false;
          return;
        }
        permissionGranted.current = true;
      }
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
            setMessage("Listening paused after one minute. Tap Listen again when you are ready.");
          }, VOICE_LISTENING_WINDOW_MS);
        }
      }
      ExpoSpeechRecognitionModule.start({
        lang: preferences.language === "Hausa" ? "ha-NG" : "en-US",
        interimResults: true,
        continuous: continuousReadingRef.current,
        iosTaskHint: "dictation",
        maxAlternatives: 3,
        contextualStrings: [...BIBLE_BOOKS.map((book) => book.name), "chapter", "verse", "next verse", "next chapter", "stop reading", "pause reading", "bookmark this verse", "save my place", "help", "settings", "bookmarks", "faster", "slower"],
        androidIntentOptions: { EXTRA_LANGUAGE_MODEL: "free_form", EXTRA_ENABLE_BIASING_DEVICE_CONTEXT: true },
      });
    } catch {
      sessionDeadline.current = 0;
      clearTimers();
      setListening(false);
      setTyping(true);
      setMessage("Could not start speech recognition. You can type a command below or try again.");
      recognitionAllowed.current = false;
    }
  }, [clearTimers, preferences.language]);

  const beginVoiceWindow = useCallback(async () => {
    clearTimers();
    sessionDeadline.current = 0;
    receivedFinalResult.current = false;
    setTranscript("");
    setMessage("Starting the voice controller. I will listen for up to one minute; take your time.");
    setTyping(false);
    await startRecognizer();
  }, [clearTimers, startRecognizer]);

  const announceAndListen = useCallback((spokenMessage: string) => {
    clearTimers();
    sessionDeadline.current = 0;
    ExpoSpeechRecognitionModule.abort();
    setListening(false);
    setMessage(spokenMessage);
    Speech.stop();
    Speech.speak(spokenMessage, {
      language: preferences.language === "Hausa" ? "ha-NG" : "en-US",
      rate: preferences.speed,
      onDone: () => {
        if (voiceControllerActive && recognitionAllowed.current) void beginVoiceWindow();
      },
      onError: () => {
        setMessage(spokenMessage);
        if (voiceControllerActive && recognitionAllowed.current) {
          restartTimer.current = setTimeout(() => {
            restartTimer.current = null;
            void beginVoiceWindow();
          }, 1200);
        }
      },
    });
  }, [beginVoiceWindow, clearTimers, preferences.language, preferences.speed, voiceControllerActive]);

  const speakHelp = useCallback(() => announceAndListen(VOICE_HELP), [announceAndListen]);

  const runCommand = useCallback((input: string) => {
    const intent = parseVoiceCommand(input);
    if (!intent) {
      announceAndListen(`I heard “${input.trim()}”, but could not match it to a command. Say Help for examples, or try again.`);
      setTyping(true);
      return;
    }
    setCommand("");
    switch (intent.type) {
      case "openReader":
        setOnboardingComplete(true);
        router.replace("/");
        announceAndListen("Opening the Bible Reader.");
        return;
      case "open":
        setReference(intent.reference);
        announceAndListen(`Opening ${formatReference(intent.reference)}.`);
        return;
      case "nextVerse": {
        if (bible.verseCount > 0 && reference.verse >= bible.verseCount) {
          const result = moveChapter(1);
          if (result.moved) announceAndListen(`That was the last verse. Moving to ${result.reference.book} chapter ${result.reference.chapter}, verse 1.`);
          else announceAndListen("You are at the last verse in Revelation. There is no next verse.");
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
        announceAndListen(result.moved
          ? `Moved to ${result.reference.book} chapter ${result.reference.chapter}.`
          : "You are at the final chapter in Revelation.");
        break;
      }
      case "previousChapter": {
        const result = moveChapter(-1);
        announceAndListen(result.moved
          ? `Moved to ${result.reference.book} chapter ${result.reference.chapter}.`
          : "You are at Genesis chapter 1, the first chapter in the Bible.");
        break;
      }
      case "read":
      case "repeat": {
        const text = bible.verseText;
        if (!text) {
          announceAndListen(bible.isLoading ? "I am still loading this verse. Please wait a moment, then say Read again." : "This verse text is not available yet. Connect the KJV source or open a downloaded chapter, then say Read again.");
          break;
        }
        startContinuousReading();
        setVoiceControllerActive(true);
        setMessage(`Reading ${formatReference(reference)} and continuing through each verse. Say Stop to end.`);
        clearTimers();
        sessionDeadline.current = Number.MAX_SAFE_INTEGER;
        receivedFinalResult.current = false;
        ExpoSpeechRecognitionModule.abort();
        setListening(false);
        restartTimer.current = setTimeout(() => {
          restartTimer.current = null;
          if (recognitionAllowed.current) void startRecognizer();
        }, 250);
        break;
      }
      case "pause":
        sessionDeadline.current = 0;
        clearTimers();
        ExpoSpeechRecognitionModule.abort();
        setListening(false);
        stopContinuousReading();
        announceAndListen("Bible reading stopped. Say Read to continue from this verse.");
        break;
      case "bookmark":
        announceAndListen(saveCurrentBookmark()
          ? `Saved ${formatReference(reference)} to Bookmarks for later reading.`
          : `${formatReference(reference)} is already saved in Bookmarks.`);
        break;
      case "home":
        router.navigate("/");
        announceAndListen("Opening Home.");
        return;
      case "settings":
        router.navigate("/(tabs)/settings");
        announceAndListen("Opening Settings.");
        return;
      case "bookmarks":
        router.navigate("/(tabs)/bookmarks");
        announceAndListen("Opening Bookmarks.");
        return;
      case "profile":
        router.navigate("/profile");
        announceAndListen("Opening Profile.");
        return;
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
    setCommand("");
  }, [announceAndListen, bible.isLoading, bible.verseCount, bible.verseText, clearTimers, moveChapter, preferences, reference, saveCurrentBookmark, setOnboardingComplete, setReference, setVoiceControllerActive, speakHelp, startContinuousReading, startRecognizer, stopContinuousReading, updatePreferences]);

  useSpeechRecognitionEvent("start", () => {
    setListening(true);
    const status = continuousReadingRef.current
      ? "Listening for Stop while the Bible is read aloud. Say Stop to end."
      : "Listening now. You have one minute. Take your time and pause when you need to.";
    setMessage(status);
    if (!continuousReadingRef.current) AccessibilityInfo.announceForAccessibility(status);
  });
  useSpeechRecognitionEvent("end", () => {
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
    const heard = event.results[0]?.transcript?.trim();
    if (!heard) return;
    setTranscript(heard);
    if (continuousReadingRef.current) {
      const stopPattern = /^(?:please\s+)?(?:stop|stop reading|pause|pause reading|stop the bible|stop playback)[.!?\s]*$/i;
      if (event.isFinal && event.results.some((result) => stopPattern.test(result.transcript.trim()))) {
        receivedFinalResult.current = true;
        sessionDeadline.current = 0;
        clearTimers();
        ExpoSpeechRecognitionModule.abort();
        setListening(false);
        stopContinuousReading();
        announceAndListen("Bible reading stopped. Say Read to continue from this verse.");
      } else if (event.isFinal) {
        setMessage("Reading aloud. Say Stop at any time to end.");
      }
      return;
    }
    if (event.isFinal) {
      receivedFinalResult.current = true;
      sessionDeadline.current = 0;
      clearTimers();
      runCommand(heard);
    }
  });
  useSpeechRecognitionEvent("error", (event) => {
    setListening(false);
    const retryable = event.error === "no-speech" || event.error === "speech-timeout";
    if (!retryable) {
      sessionDeadline.current = 0;
      clearTimers();
    }
    const detail = event.error === "not-allowed"
      ? "Microphone or speech access was denied. Enable it in device or browser settings, or type a command."
      : event.error === "language-not-supported"
        ? "This device does not support speech recognition in the selected language. You can type a command instead."
        : retryable
          ? "No words yet. Take your time; I will keep listening."
          : "Speech recognition is unavailable right now. You can type a command or try again.";
    setMessage(detail);
    if (!retryable) {
      if (continuousReadingRef.current) stopContinuousReading();
      recognitionAllowed.current = false;
      setTyping(true);
      AccessibilityInfo.announceForAccessibility(detail);
    }
  });

  useEffect(() => {
    if (voiceControllerActive) {
      void beginVoiceWindow();
      return;
    }
    sessionDeadline.current = 0;
    clearTimers();
    ExpoSpeechRecognitionModule.abort();
    setListening(false);
    return () => {
      sessionDeadline.current = 0;
      clearTimers();
      ExpoSpeechRecognitionModule.abort();
    };
  }, [beginVoiceWindow, clearTimers, voiceControllerActive]);

  const stopListening = () => {
    if (continuousReading) {
      stopContinuousReading();
      Speech.stop();
      sessionDeadline.current = 0;
      clearTimers();
      ExpoSpeechRecognitionModule.abort();
      setListening(false);
      const status = "Reading stopped. Listening for your next command.";
      setMessage(status);
      AccessibilityInfo.announceForAccessibility(status);
      restartTimer.current = setTimeout(() => {
        restartTimer.current = null;
        if (voiceControllerActive) void beginVoiceWindow();
      }, 250);
      return;
    }
    if (!listening) {
      void beginVoiceWindow();
      return;
    }
    sessionDeadline.current = 0;
    clearTimers();
    ExpoSpeechRecognitionModule.stop();
    const status = "Listening stopped. I will process any final words. If there is no command, tap Listen again or use the keyboard.";
    setMessage(status);
    AccessibilityInfo.announceForAccessibility(status);
  };

  const showTyping = () => {
    sessionDeadline.current = 0;
    clearTimers();
    ExpoSpeechRecognitionModule.abort();
    recognitionAllowed.current = false;
    setListening(false);
    setMessage("Listening stopped. Use Listen again or type a command.");
    setTyping((visible) => !visible);
  };

  const submitTypedCommand = () => {
    if (!command.trim()) {
      setMessage("Type a short command or tap Listen again to speak.");
      return;
    }
    runCommand(command);
  };

  return (
    <>
      {!voiceControllerActive ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start voice controller and listen for a command"
          accessibilityHint="Starts listening immediately. Say a Bible reference or command. Say Help for spoken examples."
          onPress={() => setVoiceControllerActive(true)}
          style={({ pressed }) => [styles.fab, pathname === "/onboarding" && styles.onboardingFab, (pathname === "/navigate" || pathname === "/bookmarks") && styles.greenFab, pathname.includes("settings") && styles.settingsFab, pressed && styles.pressed, { right: horizontalOffset, bottom: pathname === "/onboarding" ? 200 + insets.bottom : 92 + insets.bottom }]}
        >
          <Ionicons name="mic" size={26} color={pathname === "/onboarding" || pathname.includes("settings") ? colors.tealInk : colors.amberInk} />
        </Pressable>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.controller, { left: horizontalOffset, right: horizontalOffset, bottom: 82 + insets.bottom }]}>
          <View style={styles.controllerHeader}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, listening && styles.statusDotLive]} />
              <Text accessibilityRole="header" style={styles.controllerTitle}>{continuousReading ? "Bible reading · voice stop active" : "Voice controller"}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close voice controller and stop listening" onPress={closeController} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <Text accessibilityLiveRegion="polite" accessibilityRole="text" style={styles.message}>
            {message || (listening ? "Listening. Take your time." : "Ready for your next command.")}
          </Text>
          <Text style={styles.timeHint}>{continuousReading ? "Reading and listening for ‘Stop’ until you stop it." : listening ? "Listening for up to one minute. Pauses are okay." : recognitionAllowed.current ? "Listening is paused. Use Listen again or the keyboard." : "Microphone is not active. Retry listening or use the keyboard."}</Text>
          {transcript ? <Text accessibilityLiveRegion="polite" style={styles.transcript}>I heard: {transcript}</Text> : null}

          {typing ? (
            <View style={styles.inputRow}>
              <TextInput
                value={command}
                onChangeText={setCommand}
                onSubmitEditing={submitTypedCommand}
                returnKeyType="go"
                accessibilityLabel="Type a voice command"
                accessibilityHint="For example, Open Romans 6, Next verse, or say Help"
                placeholder="Type a command"
                placeholderTextColor="#898581"
                style={styles.input}
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Run typed command" onPress={submitTypedCommand} style={styles.runButton}>
                <Ionicons name="arrow-forward" size={22} color={colors.tealInk} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.controlsRow}>
            <Pressable accessibilityRole="button" accessibilityLabel={continuousReading ? "Stop Bible reading" : listening ? "Stop listening and finish this command" : "Listen again for a command"} accessibilityHint={continuousReading ? "Stops spoken Bible reading; voice commands remain active" : listening ? "Stops listening and processes the words heard" : "Starts another listening period"} accessibilityState={{ selected: listening || continuousReading }} onPress={stopListening} style={[styles.listenButton, (listening || continuousReading) && styles.listenButtonActive]}>
              <Ionicons name={listening || continuousReading ? "stop-circle-outline" : "mic-outline"} size={21} color={listening || continuousReading ? colors.amberInk : colors.tealInk} />
              <Text style={[styles.listenButtonText, (listening || continuousReading) && styles.listenButtonTextActive]}>{continuousReading ? "Stop reading" : listening ? "Finish listening" : "Listen again"}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Hear voice command examples" accessibilityHint="Speaks examples, then resumes listening" onPress={speakHelp} style={styles.helpButton}>
              <Ionicons name="help-circle-outline" size={22} color={colors.amber} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={typing ? "Hide typing field" : "Type a command instead"} accessibilityHint="Shows a text field as an alternative to speaking" onPress={showTyping} style={styles.helpButton}>
              <Ionicons name="keypad-outline" size={21} color={colors.text} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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
  closeButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  message: { color: colors.text, fontSize: 15, lineHeight: 21, marginTop: 2 },
  timeHint: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  transcript: { color: colors.amberSoft, fontSize: 14, lineHeight: 19, marginTop: 5 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 9 },
  input: { flex: 1, minHeight: 48, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, color: colors.text, fontSize: 16 },
  runButton: { width: 48, height: 48, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: colors.tealBright },
  controlsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  listenButton: { flex: 1, minHeight: 50, borderRadius: 10, backgroundColor: colors.tealBright, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  listenButtonActive: { backgroundColor: colors.amberSoft },
  listenButtonText: { color: colors.tealInk, fontSize: 15, fontWeight: "800" },
  listenButtonTextActive: { color: colors.amberInk },
  helpButton: { width: 48, height: 48, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
});
