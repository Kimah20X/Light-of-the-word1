import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React, { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Card, colors, IconButton, PrimaryButton, Screen, SectionTitle } from "@/components/light-ui";
import { formatReference, useAppState } from "@/lib/app-state";
import { getBook } from "@/lib/bible-catalog";

const VERSES: Record<string, string> = {
  "Romans 6:2": "God forbid. How shall we, that are dead to sin, live any longer therein?",
  "John 3:16": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  "Psalms 23:1": "The LORD is my shepherd; I shall not want.",
};

export default function ReaderScreen() {
  const { reference, setReference, toggleBookmark, isBookmarked, preferences, updatePreferences, setVoiceCommandOpen } = useAppState();
  const [speaking, setSpeaking] = useState(false);
  const key = formatReference(reference);
  const verseText = VERSES[key] ?? "";
  const book = getBook(reference.book);
  const displayVerse = verseText || "This verse text is not bundled in this frontend preview. The full offline KJV data file needs to be connected to display this reference.";
  const progressWidth = `${Math.min(100, Math.round((reference.chapter / (book?.chapters ?? reference.chapter)) * 100))}%` as `${number}%`;

  const speak = () => {
    if (!verseText) {
      Alert.alert("Verse text unavailable", "This frontend preview includes only a few locally bundled verse samples. Connect the app’s offline KJV JSON data to read this reference.");
      return;
    }
    Speech.stop().then(() => {
      setSpeaking(true);
      Speech.speak(`${key}. ${verseText}`, {
        rate: preferences.speed,
        language: preferences.language === "Hausa" ? "ha-NG" : "en-US",
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
  const changeVerse = (delta: number) => setReference({ ...reference, verse: Math.max(1, reference.verse + delta) });

  return (
    <Screen compactHeader offlineStatus={`Offline · ${preferences.language === "Hausa" ? "Hausa" : "English"} KJV preview`}>
      <View style={styles.chapterHeader}>
        <Text accessibilityRole="header" style={styles.chapterTitle}>{reference.book} {reference.chapter}</Text>
        <View style={styles.progressTrack} accessibilityLabel={`Chapter ${reference.chapter} of ${book?.chapters ?? reference.chapter}`}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      <Card highlighted style={styles.activeVerseCard}>
        <View style={styles.verseHeading}>
          <Text style={styles.verseNumber}>{reference.verse}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={isBookmarked ? `Remove bookmark for ${key}` : `Bookmark ${key}`} accessibilityHint="Saves this Bible verse on this device" accessibilityState={{ selected: isBookmarked }} onPress={toggleBookmark} style={styles.bookmarkAction}>
            <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={23} color={isBookmarked ? colors.tealBright : colors.amber} />
          </Pressable>
        </View>
        <Text accessibilityLabel={`${key}. ${displayVerse}`} style={[styles.verseText, { fontSize: preferences.fontSize, lineHeight: preferences.fontSize * 1.48 }]}>{displayVerse}</Text>
        {!verseText ? <Text style={styles.missingDataNote}>No text is fabricated or fetched from a service in this preview.</Text> : null}
      </Card>

      <View style={styles.playerRow}>
        <IconButton label="Previous verse" hint={`Previous verse before ${key}`} icon="play-skip-back-outline" onPress={() => changeVerse(-1)} />
        <Pressable accessibilityRole="button" accessibilityLabel={speaking ? "Pause reading" : "Read verse aloud"} accessibilityHint="Uses this device's text to speech" accessibilityState={{ selected: speaking }} onPress={togglePlayback} style={({ pressed }) => [styles.mainPlayerButton, pressed && styles.pressed]}>
          <Ionicons name={speaking ? "pause" : "play"} size={27} color={colors.amberInk} />
        </Pressable>
        <IconButton label="Next verse" hint={`Next verse after ${key}`} icon="play-skip-forward-outline" onPress={() => changeVerse(1)} />
      </View>

      <View style={styles.chapterRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous chapter" accessibilityHint="Moves to the previous chapter" onPress={() => changeChapter(-1)} style={styles.chapterButton}>
          <Ionicons name="play-back-outline" size={17} color={colors.text} /><Text style={styles.chapterButtonText}>Previous chapter</Text>
        </Pressable>
        <IconButton label="Repeat current verse" hint="Reads this verse aloud again" icon="repeat" onPress={speak} />
        <Pressable accessibilityRole="button" accessibilityLabel="Next chapter" accessibilityHint="Moves to the next chapter" onPress={() => changeChapter(1)} style={styles.chapterButton}>
          <Text style={styles.chapterButtonText}>Next chapter</Text><Ionicons name="play-forward-outline" size={17} color={colors.text} />
        </Pressable>
      </View>

      <SectionTitle>Reading Speed</SectionTitle>
      <View style={styles.speedRow} accessibilityRole="radiogroup" accessibilityLabel="Reading speed">
        {[0.75, 1, 1.25, 1.5].map((speed) => (
          <Pressable key={speed} accessibilityRole="radio" accessibilityLabel={`${speed} times reading speed`} accessibilityState={{ selected: preferences.speed === speed }} onPress={() => updatePreferences({ speed })} style={[styles.speedChip, preferences.speed === speed && styles.speedSelected]}>
            <Text style={[styles.speedText, preferences.speed === speed && styles.speedSelectedText]}>{speed.toFixed(speed === 1 ? 1 : 2)}×</Text>
          </Pressable>
        ))}
      </View>

      <PrimaryButton label="Tap to speak a command" icon="mic" hint="Opens accessible typed Bible voice commands" onPress={() => setVoiceCommandOpen(true)} />
      <View style={{ height: 14 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chapterHeader: { gap: 10, marginBottom: 22 },
  chapterTitle: { color: colors.amber, fontSize: 32, lineHeight: 40, fontWeight: "600" },
  progressTrack: { height: 9, borderRadius: 8, backgroundColor: colors.border, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.amber, borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  activeVerseCard: { backgroundColor: "#1a1a1a", borderWidth: 2, padding: 18, marginBottom: 20 },
  verseHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 7 },
  verseNumber: { color: colors.amber, fontSize: 22, lineHeight: 29, fontWeight: "700" },
  bookmarkAction: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  verseText: { color: colors.text, lineHeight: 34 },
  missingDataNote: { color: colors.amberSoft, fontSize: 13, lineHeight: 19, marginTop: 12 },
  playerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  mainPlayerButton: { width: 64, height: 64, borderRadius: 12, backgroundColor: "#c88124", borderWidth: 2, borderColor: colors.amber, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  chapterRow: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 5 },
  chapterButton: { minHeight: 44, paddingHorizontal: 6, borderRadius: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 },
  chapterButtonText: { color: colors.muted, fontSize: 10, fontWeight: "600" },
  speedRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  speedChip: { minWidth: 62, minHeight: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  speedSelected: { backgroundColor: colors.teal, borderColor: colors.teal },
  speedText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  speedSelectedText: { color: colors.tealInk },
});
