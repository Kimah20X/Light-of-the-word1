import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, PrimaryButton, Screen, SectionTitle } from "@/components/light-ui";
import { useAppState } from "@/lib/app-state";
import { BIBLE_BOOKS, parseBibleReference, type BibleBook, type Testament } from "@/lib/bible-catalog";

const TESTAMENTS: Testament[] = ["Old Testament", "New Testament"];

export default function NavigateScreen() {
  const { setReference, reference, setVoiceControllerActive } = useAppState();
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState("1");

  const sections = useMemo(() => TESTAMENTS.map((testament) => ({
    testament,
    books: BIBLE_BOOKS.filter((book) => book.testament === testament && book.name.toLowerCase().includes(search.trim().toLowerCase())),
  })), [search]);
  const directReference = parseBibleReference(search);

  const openDirect = () => {
    if (!directReference) return false;
    setReference(directReference);
    router.navigate("/");
    return true;
  };
  const openSelected = () => {
    const verseNumber = Number.parseInt(verse, 10);
    if (!selectedBook || !Number.isInteger(chapter) || chapter < 1 || chapter > selectedBook.chapters || !Number.isInteger(verseNumber) || verseNumber < 1) {
      Alert.alert("Check passage", "Choose a valid book and chapter, and enter a verse number of 1 or higher.");
      return;
    }
    setReference({ book: selectedBook.name, chapter, verse: verseNumber });
    router.navigate("/");
  };
  const chooseBook = (book: BibleBook) => {
    setSelectedBook(book);
    setChapter(book.name === reference.book ? reference.chapter : 1);
    setVerse(book.name === reference.book ? String(reference.verse) : "1");
  };

  return (
    <Screen noScroll>
      <View style={styles.page}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={19} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => { if (!openDirect()) setSelectedBook(null); }}
            returnKeyType="go"
            accessibilityLabel="Search Bible books or open a reference"
            accessibilityHint="Search books, or enter a direct reference such as John 3:16"
            placeholder="Search for books or verses..."
            placeholderTextColor="#d7c3b1"
            style={styles.searchInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={directReference ? "Open typed Bible reference" : "Start voice controller and listen for a Bible reference"}
            accessibilityHint={directReference ? "Opens the Bible reader at this passage" : "Starts listening immediately. Say a Bible book, chapter, and verse."}
            onPress={() => { if (!openDirect()) setVoiceControllerActive(true); }}
            style={styles.searchMic}
          >
            <Ionicons name={directReference ? "arrow-forward" : "mic"} size={22} color={colors.tealBright} />
          </Pressable>
        </View>
        <Text style={styles.voiceHint}>Try saying “Open John chapter 3”</Text>

        {selectedBook ? (
          <FlatList
            key="chapter-grid"
            data={Array.from({ length: selectedBook.chapters }, (_, index) => index + 1)}
            numColumns={6}
            keyExtractor={(item) => `${selectedBook.name}-${item}`}
            contentContainerStyle={styles.chapterContent}
            columnWrapperStyle={styles.chapterRow}
            ListHeaderComponent={(
              <View>
                <View style={styles.verticalHeading}>
                  <Text style={styles.eyebrow}>{selectedBook.testament.toUpperCase()}</Text>
                  <Text accessibilityRole="header" style={styles.selectedTitle}>{selectedBook.name}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Back to all books" onPress={() => setSelectedBook(null)} style={styles.backButton}>
                  <Ionicons name="chevron-back" size={17} color={colors.muted} /><Text style={styles.backText}>All books</Text>
                </Pressable>
                <SectionTitle>Choose a chapter</SectionTitle>
              </View>
            )}
            ListFooterComponent={(
              <View>
                <SectionTitle>Choose a verse</SectionTitle>
                <TextInput value={verse} onChangeText={setVerse} keyboardType="number-pad" accessibilityLabel="Verse number" accessibilityHint="Enter a verse number" returnKeyType="done" style={styles.verseInput} />
                <View style={styles.previewRef}>
                  <Text style={styles.previewLabel}>SELECTED PASSAGE</Text>
                  <Text style={styles.previewValue}>{selectedBook.name} {chapter}:{verse || "—"}</Text>
                </View>
                <PrimaryButton label="Open passage" icon="book-outline" onPress={openSelected} />
              </View>
            )}
            renderItem={({ item }) => (
              <Pressable accessibilityRole="radio" accessibilityLabel={`Chapter ${item}`} accessibilityState={{ selected: chapter === item }} onPress={() => setChapter(item)} style={[styles.chapterCell, chapter === item && styles.chapterSelected]}>
                <Text style={[styles.chapterText, chapter === item && styles.chapterTextSelected]}>{item}</Text>
              </Pressable>
            )}
          />
        ) : (
          <FlatList
            key="testament-sections"
            data={sections.filter((section) => section.books.length > 0)}
            keyExtractor={(item) => item.testament}
            contentContainerStyle={styles.sectionList}
            ListEmptyComponent={<Text style={styles.empty}>No books match your search. Try a direct reference such as Romans 6:2.</Text>}
            renderItem={({ item }) => (
              <View style={styles.testamentSection}>
                <View style={[styles.verticalHeading, item.testament === "New Testament" && styles.newTestamentBorder]}>
                  <Text accessibilityRole="header" style={styles.testamentTitle}>{item.testament}</Text>
                </View>
                <View style={styles.bookGrid}>
                  {item.books.map((book) => {
                    const selected = book.name === reference.book;
                    return (
                      <Pressable key={book.name} accessibilityRole="button" accessibilityLabel={`${book.name}, ${book.chapters} chapters`} accessibilityHint="Opens chapter and verse selection" onPress={() => chooseBook(book)} style={({ pressed }) => [styles.bookCard, selected && styles.currentBook, pressed && styles.pressed]}>
                        <Text style={styles.bookName}>{book.name}</Text>
                        <Text style={styles.chapterCount}>{book.chapters} Chapters</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  searchBar: { height: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 16, paddingRight: 10, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 9 },
  searchInput: { flex: 1, minHeight: 52, color: colors.text, fontSize: 16 },
  searchMic: { width: 44, height: 46, alignItems: "center", justifyContent: "center" },
  voiceHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 18, paddingHorizontal: 4 },
  sectionList: { paddingBottom: 130 },
  testamentSection: { marginBottom: 24 },
  verticalHeading: { minHeight: 38, justifyContent: "center", borderLeftWidth: 3, borderLeftColor: colors.amber, paddingLeft: 12, marginBottom: 15 },
  newTestamentBorder: { borderLeftColor: colors.tealBright },
  testamentTitle: { color: colors.text, fontSize: 28, lineHeight: 36, fontFamily: "serif", fontWeight: "600" },
  bookGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  bookCard: { width: "48%", minHeight: 76, paddingVertical: 14, paddingHorizontal: 15, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: "center" },
  currentBook: { borderColor: colors.amberStrong, borderWidth: 2, shadowColor: colors.amberStrong, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8 },
  bookName: { color: colors.text, fontSize: 16, fontFamily: "serif", fontWeight: "700", marginBottom: 4 },
  chapterCount: { color: colors.amberStrong, fontSize: 12 },
  pressed: { opacity: 0.7 },
  empty: { color: colors.muted, fontSize: 14, lineHeight: 22, paddingVertical: 14 },
  eyebrow: { color: colors.tealBright, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  selectedTitle: { color: colors.amber, fontSize: 24, lineHeight: 32, fontWeight: "700", marginTop: 2 },
  backButton: { minHeight: 42, flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 8 },
  backText: { color: colors.muted, fontSize: 14 },
  chapterContent: { paddingBottom: 130 },
  chapterRow: { gap: 7, justifyContent: "space-between" },
  chapterCell: { flex: 1, height: 42, marginBottom: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  chapterSelected: { backgroundColor: colors.teal, borderColor: colors.teal },
  chapterText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  chapterTextSelected: { color: colors.tealInk },
  verseInput: { width: 130, minHeight: 50, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 9, paddingHorizontal: 14, color: colors.text, fontSize: 17, marginBottom: 12 },
  previewRef: { backgroundColor: colors.surface, borderRadius: 9, borderLeftWidth: 3, borderLeftColor: colors.amber, padding: 12, marginBottom: 12 },
  previewLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  previewValue: { color: colors.amberSoft, fontSize: 16, fontWeight: "700", marginTop: 5 },
});
