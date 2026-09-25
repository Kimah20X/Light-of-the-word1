import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import React, { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, colors, IconButton, Notice, PageTitle, PrimaryButton, Screen, SectionTitle } from "@/components/light-ui";
import { formatReference, useAppState } from "@/lib/app-state";
import { getBook, parseBibleReference } from "@/lib/bible-catalog";

const VERSES: Record<string, string> = {
  "Romans 6:2": "God forbid. How shall we, that are dead to sin, live any longer therein?",
  "John 3:16": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  "Psalms 23:1": "The LORD is my shepherd; I shall not want.",
};

export default function ReaderScreen() {
  const { reference, setReference, toggleBookmark, isBookmarked, preferences, updatePreferences } = useAppState();
  const [command, setCommand] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const key = formatReference(reference);
  const verseText = VERSES[key] ?? "";
  const book = getBook(reference.book);
  const displayVerse = verseText || "This verse text is not bundled in this frontend preview. The full offline KJV data file needs to be connected to display this reference.";

  const speak = () => {
    if (!verseText) {
      Alert.alert("Verse text unavailable", "This frontend preview includes only a few locally bundled verse samples. Connect the app’s offline KJV JSON data to read this reference.");
      return;
    }
    Speech.stop().then(() => {
      setSpeaking(true);
      Speech.speak(`${key}. ${verseText}`, {
        rate: preferences.speed,
        language: "en-US",
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    });
  };

  const togglePlayback = async () => {
    if (speaking) {
      if (await Speech.isSpeakingAsync()) {
        if (Platform.OS === "android") await Speech.stop();
        else await Speech.pause();
      }
      setSpeaking(false);
      return;
    }
    if (Platform.OS !== "android" && await Speech.isSpeakingAsync()) {
      await Speech.resume();
      setSpeaking(true);
      return;
    }
    speak();
  };

  const changeChapter = (delta: number) => {
    const next = Math.max(1, Math.min(book?.chapters ?? reference.chapter, reference.chapter + delta));
    setReference({ ...reference, chapter: next, verse: 1 });
  };

  const changeVerse = (delta: number) => {
    const next = Math.max(1, reference.verse + delta);
    setReference({ ...reference, verse: next });
  };

  const runCommand = () => {
    const text = command.trim();
    if (!text) return;
    const target = parseBibleReference(text.replace(/^open\s+/i, ""));
    if (/^(open\s+)/i.test(text) && target) {
      setReference(target);
      setCommand("");
      return;
    }
    if (/^(next|previous|prev)\s+verse$/i.test(text)) {
      changeVerse(/^next/i.test(text) ? 1 : -1);
      setCommand("");
      return;
    }
    if (/^(next|previous|prev)\s+chapter$/i.test(text)) {
      changeChapter(/^next/i.test(text) ? 1 : -1);
      setCommand("");
      return;
    }
    if (/^(read|resume|play)$/i.test(text)) togglePlayback();
    else if (/^(pause|stop)$/i.test(text)) { Speech.stop(); setSpeaking(false); }
    else if (/^repeat$/i.test(text)) speak();
    else if (/^(bookmark|bookmark this verse)$/i.test(text)) toggleBookmark();
    else if (/^(go\s+)?home$/i.test(text)) router.navigate("/");
    else if (/^(go\s+)?settings$/i.test(text)) router.navigate("/(tabs)/settings");
    else if (/^(go\s+)?bookmarks$/i.test(text)) router.navigate("/(tabs)/bookmarks");
    else {
      Alert.alert("Command not recognized", "Try “Open Romans 6:2”, “Next verse”, “Read”, “Bookmark this verse”, “Settings”, or “Bookmarks”.");
    }
    setCommand("");
  };

  const quickActions = [
    { label: "Previous verse", icon: "play-skip-back-outline" as const, action: () => changeVerse(-1) },
    { label: "Previous chapter", icon: "play-back-outline" as const, action: () => changeChapter(-1) },
    { label: "Next chapter", icon: "play-forward-outline" as const, action: () => changeChapter(1) },
    { label: "Next verse", icon: "play-skip-forward-outline" as const, action: () => changeVerse(1) },
  ];

  return (
    <Screen>
      <View style={styles.offlineBanner} accessibilityRole="text">
        <Ionicons name="cloud-offline-outline" size={17} color={colors.tealBright} />
        <Text style={styles.offlineText}>Offline-first preview · KJV data not connected</Text>
      </View>
      <PageTitle title="Bible Reader" subtitle="King James Version · Local reading preview" />

      <View style={styles.referenceRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.referenceLabel}>CURRENT PASSAGE</Text>
          <Text accessibilityRole="header" style={styles.referenceTitle}>{key}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={isBookmarked ? "Remove bookmark" : "Bookmark current verse"} accessibilityHint="Saves this verse on this device" accessibilityState={{ selected: isBookmarked }} onPress={toggleBookmark} style={styles.bookmarkAction}>
          <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={23} color={isBookmarked ? colors.tealBright : colors.amber} />
          <Text style={styles.bookmarkActionText}>{isBookmarked ? "Saved" : "Save"}</Text>
        </Pressable>
      </View>

      <Card highlighted>
        <Text style={styles.verseNumber}>{reference.verse}</Text>
        <Text accessibilityRole="text" style={[styles.verseText, { fontSize: preferences.fontSize, lineHeight: preferences.fontSize * 1.52 }]}>{displayVerse}</Text>
        {!verseText ? <Text style={styles.missingDataNote}>No text is fabricated or fetched from a service in this preview.</Text> : null}
      </Card>

      <View style={styles.transport}>
        {quickActions.map((item) => <IconButton key={item.label} label={item.label} hint={`Move from ${key}`} icon={item.icon} onPress={item.action} />)}
      </View>
      <View style={styles.playbackRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={speaking ? "Pause reading" : "Read verse aloud"} accessibilityHint="Uses the device's built-in text to speech" onPress={togglePlayback} style={styles.playButton}>
          <Ionicons name={speaking ? "pause" : "play"} size={22} color={colors.tealInk} />
          <Text style={styles.playButtonText}>{speaking ? "Pause" : "Read aloud"}</Text>
        </Pressable>
        <IconButton label="Repeat current verse" hint="Speaks the current verse again" icon="repeat" onPress={speak} />
      </View>

      <SectionTitle>Reading speed</SectionTitle>
      <View style={styles.speedRow}>
        {[0.75, 1, 1.25, 1.5].map((speed) => (
          <Pressable key={speed} accessibilityRole="radio" accessibilityLabel={`${speed} times reading speed`} accessibilityState={{ selected: preferences.speed === speed }} onPress={() => updatePreferences({ speed })} style={[styles.speedChip, preferences.speed === speed && styles.speedSelected]}>
            <Text style={[styles.speedText, preferences.speed === speed && styles.speedSelectedText]}>{speed.toFixed(speed === 1 ? 1 : 2)}×</Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle>Voice command</SectionTitle>
      <Notice>Voice recognition needs platform permissions and the app’s existing voice service. You can try the command parser by typing a phrase below.</Notice>
      <View style={styles.commandRow}>
        <TextInput value={command} onChangeText={setCommand} onSubmitEditing={runCommand} returnKeyType="go" placeholder="Open Romans 6:2" placeholderTextColor="#898581" accessibilityLabel="Voice command text" accessibilityHint="Type a command such as Open John 3:16, Next verse, or Bookmark this verse" style={styles.commandInput} />
        <Pressable accessibilityRole="button" accessibilityLabel="Run command" accessibilityHint="Runs the command you typed" onPress={runCommand} style={styles.micButton}>
          <Ionicons name="mic-outline" size={23} color={colors.tealInk} />
        </Pressable>
      </View>
      <Text style={styles.examples}>Examples: “Open John 3:16” · “Next chapter” · “Repeat”</Text>
      <PrimaryButton label="Choose a book or passage" icon="book-outline" hint="Opens search and the Old and New Testament book lists" onPress={() => router.navigate("/(tabs)/navigate")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  offlineBanner: { flexDirection: "row", gap: 8, alignItems: "center", alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 11, marginBottom: 14, backgroundColor: "#10211b", borderRadius: 8 },
  offlineText: { color: colors.tealBright, fontSize: 12, fontWeight: "600" },
  referenceRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  referenceLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.1, marginBottom: 4 },
  referenceTitle: { color: colors.amber, fontSize: 27, lineHeight: 34, fontWeight: "700" },
  bookmarkAction: { minHeight: 52, minWidth: 64, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 10, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 5 },
  bookmarkActionText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  verseNumber: { color: colors.amber, fontSize: 17, fontWeight: "700", marginBottom: 8 },
  verseText: { color: colors.text, lineHeight: 34 },
  missingDataNote: { color: colors.amberSoft, fontSize: 13, lineHeight: 19, marginTop: 12 },
  transport: { flexDirection: "row", justifyContent: "space-between", gap: 9, marginTop: 2, marginBottom: 11 },
  playbackRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  playButton: { flex: 1, minHeight: 54, borderRadius: 10, backgroundColor: colors.tealBright, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  playButtonText: { color: colors.tealInk, fontSize: 16, fontWeight: "700" },
  speedRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  speedChip: { minWidth: 62, minHeight: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  speedSelected: { backgroundColor: colors.tealBright, borderColor: colors.tealBright },
  speedText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  speedSelectedText: { color: colors.tealInk },
  commandRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  commandInput: { flex: 1, minHeight: 54, paddingHorizontal: 14, backgroundColor: colors.surface, color: colors.text, borderRadius: 10, borderWidth: 1, borderColor: colors.border, fontSize: 16 },
  micButton: { minWidth: 58, minHeight: 54, backgroundColor: colors.tealBright, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  examples: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 17 },
});
