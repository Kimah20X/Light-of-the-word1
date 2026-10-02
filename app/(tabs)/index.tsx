import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React, { useEffect } from "react";
import { AccessibilityInfo, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card, colors, IconButton, Screen, SectionTitle } from "@/components/light-ui";
import { formatReference, useAppState } from "@/lib/app-state";
import { getBook } from "@/lib/bible-catalog";
import { getPreviewVerseText } from "@/lib/preview-verses";
import { useBibleChapter } from "@/lib/use-bible-chapter";
import { ApiBibleFumsReporter } from "@/components/api-bible-fums";
import { nextVerseReference } from "@/lib/voice-command";

export default function ReaderScreen() {
  const { reference, setReference, toggleBookmark, isBookmarked, preferences, updatePreferences, continuousReading, playbackSequence, startContinuousReading, stopContinuousReading, setVoiceControllerActive } = useAppState();
  const key = formatReference(reference);
  const bible = useBibleChapter();
  const sampleText = getPreviewVerseText(reference);
  const useExplicitPreviewSample = bible.providerReady && !bible.providerConfigured && !bible.hasProviderIdentity;
  const verseText = bible.verseText || (useExplicitPreviewSample ? sampleText : "");
  const book = getBook(reference.book);
  const displayVerse = verseText || (bible.isLoading
    ? "Loading this chapter…"
    : bible.providerConfigured
      ? bible.fetchError?.message ?? "This verse is not available in the configured translation."
      : bible.hasProviderIdentity
        ? "This saved chapter is outside its 30-day cache period; connect to refresh it."
        : "Add the API.Bible project secrets to load the full KJV. Any sample text shown here is preview-only.");
  const progressWidth = `${Math.min(100, Math.round((reference.chapter / (book?.chapters ?? reference.chapter)) * 100))}%` as `${number}%`;

  const offlineStatus = !bible.providerReady
    ? bible.hasProviderIdentity ? "Provider unavailable · saved chapters are local" : "Checking Bible provider"
    : bible.isOfflineCached
    ? bible.isCacheStale ? "Cached on this device · refresh required" : "Chapter saved on this device"
    : bible.providerConfigured ? "API.Bible · fetched chapters save here" : "Bible provider setup needed";

  useEffect(() => {
    if (!continuousReading) {
      return;
    }
    let cancelled = false;
    if (!verseText) {
      if (bible.isLoading) return () => { cancelled = true; };
      const unavailable = "This verse is not available to read aloud. Connect to the Bible service or open a cached chapter.";
      stopContinuousReading();
      setVoiceControllerActive(false);
      AccessibilityInfo.announceForAccessibility(unavailable);
      Speech.speak(unavailable, { language: preferences.language === "Hausa" ? "ha-NG" : "en-US" });
      return () => { cancelled = true; };
    }

    Speech.stop().then(() => {
      if (cancelled) return;
      Speech.speak(`${key}. ${verseText}`, {
        rate: preferences.speed,
        language: preferences.language === "Hausa" ? "ha-NG" : "en-US",
        volume: 1,
        onDone: () => {
          if (cancelled) return;
          const next = nextVerseReference(reference, bible.verseCount);
          if (next.moved) {
            setReference(next.reference);
            return;
          }
          stopContinuousReading();
          setVoiceControllerActive(false);
          const ending = next.reachedEnd
            ? "You have reached the final verse of Revelation. Reading is complete."
            : "The next verse is not available in this chapter. Reading has stopped.";
          AccessibilityInfo.announceForAccessibility(ending);
          Speech.speak(ending, { language: preferences.language === "Hausa" ? "ha-NG" : "en-US" });
        },
        onError: () => {
          if (cancelled) return;
          stopContinuousReading();
          setVoiceControllerActive(false);
          const error = "Text to speech stopped unexpectedly. Try playing this verse again.";
          AccessibilityInfo.announceForAccessibility(error);
        },
      });
    });
    return () => {
      cancelled = true;
      void Speech.stop();
    };
  }, [bible.isLoading, bible.verseCount, continuousReading, key, playbackSequence, preferences.language, preferences.speed, reference, setReference, setVoiceControllerActive, stopContinuousReading, verseText]);

  const togglePlayback = () => {
    if (continuousReading) {
      stopContinuousReading();
      setVoiceControllerActive(false);
      return;
    }
    if (!verseText && !bible.isLoading) {
      Alert.alert("Verse text unavailable", "Connect to the Bible service or open a cached chapter before starting continuous reading.");
      return;
    }
    startContinuousReading();
    setVoiceControllerActive(true);
  };

  const repeatVerse = () => {
    startContinuousReading();
    setVoiceControllerActive(true);
  };

  const changeChapter = (delta: number) => {
    const next = Math.max(1, Math.min(book?.chapters ?? reference.chapter, reference.chapter + delta));
    setReference({ ...reference, chapter: next, verse: 1 });
  };
  const changeVerse = (delta: number) => setReference({ ...reference, verse: Math.max(1, reference.verse + delta) });

  return (
    <Screen compactHeader offlineStatus={offlineStatus}>
      <ApiBibleFumsReporter token={bible.fumsToken} viewKey={key} />
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
        {!verseText ? <Text style={styles.missingDataNote}>{bible.isCacheStale ? "This saved chapter is older than 30 days and must be refreshed before display." : bible.fetchError && bible.isOfflineCached ? "Showing the saved chapter because the service is unavailable." : "Only API.Bible passages or the explicitly marked local preview sample are displayed."}</Text> : null}
        {bible.chapter?.copyright ? <Text style={styles.copyright}>{bible.chapter.copyright}</Text> : null}
      </Card>

      {bible.providerConfigured && bible.fetchError && !bible.isOfflineCached ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Retry loading this Bible chapter" onPress={() => bible.refresh()} style={styles.retryButton}>
          <Ionicons name="refresh-outline" size={18} color={colors.tealBright} />
          <Text style={styles.retryText}>Retry chapter</Text>
        </Pressable>
      ) : null}

      <View style={styles.playerRow}>
        <IconButton label="Previous verse" hint={`Previous verse before ${key}`} icon="play-skip-back-outline" onPress={() => changeVerse(-1)} />
        <Pressable accessibilityRole="button" accessibilityLabel={continuousReading ? "Stop continuous Bible reading" : "Read from this verse and continue"} accessibilityHint={continuousReading ? "Stops Bible read-aloud and listening" : "Reads each verse aloud and continues into following chapters until you say Stop"} accessibilityState={{ selected: continuousReading }} onPress={togglePlayback} style={({ pressed }) => [styles.mainPlayerButton, pressed && styles.pressed]}>
          <Ionicons name={continuousReading ? "stop" : "play"} size={27} color={colors.amberInk} />
        </Pressable>
        <IconButton label="Next verse" hint={`Next verse after ${key}`} icon="play-skip-forward-outline" onPress={() => changeVerse(1)} />
      </View>

      <View style={styles.chapterRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous chapter" accessibilityHint="Moves to the previous chapter" onPress={() => changeChapter(-1)} style={styles.chapterButton}>
          <Ionicons name="play-back-outline" size={17} color={colors.text} /><Text style={styles.chapterButtonText}>Previous chapter</Text>
        </Pressable>
        <IconButton label="Repeat current verse and continue" hint="Starts reading from this verse and continues through the Bible until you say Stop" icon="repeat" onPress={repeatVerse} />
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
  copyright: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 10 },
  retryButton: { minHeight: 44, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, marginTop: -12, marginBottom: 8 },
  retryText: { color: colors.tealBright, fontSize: 14, fontWeight: "600" },
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
