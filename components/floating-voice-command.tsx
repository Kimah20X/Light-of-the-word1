import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import * as Speech from "expo-speech";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import React, { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { colors } from "@/components/light-ui";
import { formatReference, useAppState } from "@/lib/app-state";
import { getBook } from "@/lib/bible-catalog";
import { getPreviewVerseText } from "@/lib/preview-verses";
import { parseVoiceCommand, READING_SPEEDS } from "@/lib/voice-command";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function FloatingVoiceCommand() {
  const { reference, setReference, toggleBookmark, preferences, updatePreferences, voiceCommandOpen: visible, setVoiceCommandOpen: setVisible } = useAppState();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const viewport = useWindowDimensions();
  const shellWidth = Math.min(viewport.width, 390);
  const horizontalOffset = Math.max(18, (viewport.width - shellWidth) / 2 + 18);
  const [command, setCommand] = useState("");
  const [message, setMessage] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const book = getBook(reference.book);

  const close = () => {
    if (listening) ExpoSpeechRecognitionModule.abort();
    setVisible(false);
  };

  const moveChapter = (delta: number) => {
    const chapter = Math.max(1, Math.min(book?.chapters ?? reference.chapter, reference.chapter + delta));
    setReference({ ...reference, chapter, verse: 1 });
  };

  const readCurrentVerse = () => {
    const text = getPreviewVerseText(reference);
    if (!text) {
      setMessage("This verse is not in the preview sample. Connect the complete offline KJV dataset for speech on all verses.");
      return;
    }
    Speech.stop();
    setSpeaking(true);
    Speech.speak(`${formatReference(reference)}. ${text}`, {
      rate: preferences.speed,
      language: preferences.language === "Hausa" ? "ha-NG" : "en-US",
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const runCommand = (input: string = command) => {
    const intent = parseVoiceCommand(input);
    if (!intent) {
      setMessage("Command not recognized. Try “Open Romans 6”, “Next verse”, “Read”, or “Settings”.");
      return;
    }
    setMessage("");
    switch (intent.type) {
      case "open":
        setReference(intent.reference);
        close();
        return;
      case "nextVerse":
        setReference({ ...reference, verse: reference.verse + 1 });
        break;
      case "previousVerse":
        setReference({ ...reference, verse: Math.max(1, reference.verse - 1) });
        break;
      case "nextChapter":
        moveChapter(1);
        break;
      case "previousChapter":
        moveChapter(-1);
        break;
      case "read":
      case "repeat":
        readCurrentVerse();
        break;
      case "pause":
        Speech.stop();
        setSpeaking(false);
        break;
      case "bookmark":
        toggleBookmark();
        setMessage(`Bookmark updated for ${formatReference(reference)}.`);
        break;
      case "home":
        router.navigate("/");
        close();
        return;
      case "settings":
        router.navigate("/(tabs)/settings");
        close();
        return;
      case "bookmarks":
        router.navigate("/(tabs)/bookmarks");
        close();
        return;
      case "profile":
        router.navigate("/profile");
        close();
        return;
      case "speed":
        updatePreferences({ speed: intent.value });
        setMessage(`Reading speed set to ${intent.value} times.`);
        break;
      case "faster":
      case "slower": {
        const currentIndex = READING_SPEEDS.indexOf(preferences.speed as (typeof READING_SPEEDS)[number]);
        const nextIndex = Math.max(0, Math.min(READING_SPEEDS.length - 1, currentIndex + (intent.type === "faster" ? 1 : -1)));
        const speed = READING_SPEEDS[nextIndex];
        updatePreferences({ speed });
        setMessage(`Reading speed set to ${speed} times.`);
        break;
      }
      default:
        break;
    }
    setCommand("");
  };

  useSpeechRecognitionEvent("start", () => {
    setListening(true);
    setMessage("Listening. Say one command, then pause.");
  });
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("result", (event) => {
    const heard = event.results[0]?.transcript?.trim();
    if (!heard) return;
    setTranscript(heard);
    setCommand(heard);
    if (event.isFinal) runCommand(heard);
  });
  useSpeechRecognitionEvent("error", (event) => {
    setListening(false);
    const detail = event.error === "not-allowed"
      ? "Microphone or speech access was denied. Enable it in your device or browser settings."
      : event.error === "language-not-supported"
        ? "This device does not support speech recognition in the selected language. You can type the command instead."
        : event.error === "no-speech" || event.error === "speech-timeout"
          ? "I did not hear a command. Try again or type it below."
          : "Speech recognition is unavailable right now. You can type the command below.";
    setMessage(detail);
  });

  const startListening = async () => {
    setMessage("");
    setTranscript("");
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      setMessage("Speech recognition is not available in this browser or build. Type your command below.");
      return;
    }
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setMessage("Microphone and speech-recognition permission are needed. You can still type commands below.");
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: preferences.language === "Hausa" ? "ha-NG" : "en-US",
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        contextualStrings: ["Genesis", "Exodus", "Psalms", "Matthew", "John", "Romans", "Revelation", "chapter", "verse", "bookmark"],
      });
    } catch {
      setListening(false);
      setMessage("Could not start speech recognition. Type your command below instead.");
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voice command"
        accessibilityHint="Opens spoken Bible commands when your device or browser supports speech recognition, with a typed command option."
        accessibilityState={{ expanded: visible }}
        onPress={() => { setMessage(""); setVisible(true); }}
        style={({ pressed }) => [styles.fab, pathname === "/onboarding" && styles.onboardingFab, (pathname === "/navigate" || pathname === "/bookmarks") && styles.greenFab, pathname.includes("settings") && styles.settingsFab, pressed && styles.pressed, { right: horizontalOffset, bottom: pathname === "/onboarding" ? 200 + insets.bottom : 92 + insets.bottom }]}
      >
        <Ionicons name="mic" size={26} color={pathname === "/onboarding" || pathname.includes("settings") ? colors.tealInk : colors.amberInk} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
        <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close voice command" style={styles.scrim} onPress={close} />
          <View accessibilityViewIsModal style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleWrap}>
                <View style={styles.sheetIcon}><Ionicons name="mic" size={20} color={colors.tealBright} /></View>
                <View style={{ flex: 1 }}>
                  <Text accessibilityRole="header" style={styles.sheetTitle}>Voice command</Text>
                  <Text style={styles.sheetSubtitle}>Current passage: {formatReference(reference)}</Text>
                </View>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close voice command" onPress={close} style={styles.closeButton}>
                <Ionicons name="close" size={23} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.statusBox}>
              <Ionicons name="information-circle-outline" size={19} color={colors.amber} />
              <Text style={styles.statusText}>Speak one command or type it below. A secure browser/device speech service is required for recognition.</Text>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                value={command}
                onChangeText={setCommand}
                onSubmitEditing={() => runCommand()}
                returnKeyType="go"
                accessibilityLabel="Voice command text"
                accessibilityHint="For example, Open Romans 6:2, Next verse, or Bookmark this verse"
                placeholder="Try: Open Romans 6:2"
                placeholderTextColor="#898581"
                style={styles.input}
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Run voice command" onPress={() => runCommand()} style={styles.runButton}>
                <Ionicons name="arrow-forward" size={22} color={colors.tealInk} />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={listening ? "Stop listening" : "Speak a command"}
              accessibilityHint={listening ? "Ends speech recognition and processes the command heard" : "Requests microphone permission and listens for one Bible command"}
              accessibilityState={{ selected: listening }}
              onPress={() => listening ? ExpoSpeechRecognitionModule.stop() : void startListening()}
              style={[styles.listenButton, listening && styles.listenButtonActive]}
            >
              <Ionicons name={listening ? "stop-circle-outline" : "mic-outline"} size={22} color={colors.tealInk} />
              <Text style={styles.listenButtonText}>{listening ? "Listening… Tap to stop" : "Speak a command"}</Text>
            </Pressable>
            {transcript ? <Text accessibilityLiveRegion="polite" style={styles.transcript}>Heard: {transcript}</Text> : null}

            <View style={styles.shortcutRow}>
              <Pressable accessibilityRole="button" onPress={() => { setCommand("Open Romans 6"); }} style={styles.shortcut}><Text style={styles.shortcutText}>Romans 6</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => { setCommand("Next verse"); }} style={styles.shortcut}><Text style={styles.shortcutText}>Next verse</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => { setCommand(speaking ? "Pause" : "Read"); }} style={styles.shortcut}><Text style={styles.shortcutText}>{speaking ? "Pause" : "Read"}</Text></Pressable>
            </View>

            {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
            <Text style={styles.example}>Your device/browser’s recognition service processes speech; its internet and privacy behavior depends on that service. The app does not send recordings to our backend. If recognition is unavailable, type commands below. Also try “Previous chapter”, “Repeat”, “Bookmark this verse”, or “Change speed to 1.25”.</Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: "absolute", right: 18, bottom: Platform.OS === "web" ? 92 : 110, zIndex: 20, width: 64, height: 64, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#c88124", borderWidth: 2, borderColor: "rgba(0,0,0,0.5)", shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.32, shadowRadius: 9, elevation: 8 },
  onboardingFab: { backgroundColor: "#1d9e75", right: 20 },
  greenFab: { backgroundColor: colors.teal },
  settingsFab: { backgroundColor: colors.amber },
  pressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
  modalRoot: { flex: 1, justifyContent: "flex-end", padding: 16 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.72)" },
  sheet: { width: "100%", maxWidth: 390, alignSelf: "center", padding: 18, borderRadius: 20, borderWidth: 1, borderColor: "#6b5126", backgroundColor: colors.surface, marginBottom: Platform.OS === "web" ? 72 : 8, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sheetTitleWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  sheetIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#10211b" },
  sheetTitle: { color: colors.text, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  sheetSubtitle: { color: colors.amberSoft, fontSize: 13, lineHeight: 19 },
  closeButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  statusBox: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 12, marginBottom: 13, borderRadius: 10, borderWidth: 1, borderColor: "#775820", backgroundColor: "#21190d" },
  statusText: { flex: 1, color: "#ead6b5", fontSize: 13, lineHeight: 19 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  input: { flex: 1, minHeight: 54, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, color: colors.text, fontSize: 16 },
  runButton: { width: 56, height: 54, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.tealBright },
  listenButton: { minHeight: 54, marginTop: 12, borderRadius: 11, backgroundColor: colors.tealBright, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  listenButtonActive: { backgroundColor: colors.amberSoft },
  listenButtonText: { color: colors.tealInk, fontSize: 16, fontWeight: "800" },
  transcript: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 8 },
  shortcutRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 11 },
  shortcut: { minHeight: 42, paddingHorizontal: 12, justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised },
  shortcutText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  message: { color: colors.tealBright, fontSize: 14, lineHeight: 20, marginTop: 11 },
  example: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 11 },
});
