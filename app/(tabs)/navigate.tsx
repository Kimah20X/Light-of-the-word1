import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, PageTitle, PrimaryButton, Screen, SectionTitle } from "@/components/light-ui";
import { useAppState } from "@/lib/app-state";
import { BIBLE_BOOKS, parseBibleReference, type BibleBook, type Testament } from "@/lib/bible-catalog";

export default function NavigateScreen() {
  const { setReference, reference } = useAppState();
  const [testament, setTestament] = useState<Testament>("Old Testament");
  const [search, setSearch] = useState("");
  const [direct, setDirect] = useState("");
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState("1");

  const books = useMemo(() => BIBLE_BOOKS.filter((book) => book.testament === testament && book.name.toLowerCase().includes(search.trim().toLowerCase())), [testament, search]);
  const openSelected = () => {
    const verseNumber = Number.parseInt(verse, 10);
    if (!selectedBook || !Number.isInteger(chapter) || chapter < 1 || chapter > selectedBook.chapters || !Number.isInteger(verseNumber) || verseNumber < 1) {
      Alert.alert("Check passage", "Choose a valid book and chapter, and enter a verse number of 1 or higher.");
      return;
    }
    setReference({ book: selectedBook.name, chapter, verse: verseNumber });
    router.navigate("/");
  };
  const openDirect = () => {
    const parsed = parseBibleReference(direct);
    if (!parsed) {
      Alert.alert("Reference not found", "Enter a book and chapter, such as Romans 6 or John 3:16.");
      return;
    }
    setReference(parsed);
    router.navigate("/");
  };
  const chooseBook = (book: BibleBook) => {
    setSelectedBook(book);
    setChapter(1);
    setVerse("1");
  };

  return (
    <Screen noScroll>
      <View style={styles.page}>
        <PageTitle title="Navigate" subtitle="Find a passage by book, chapter, and verse." />
        <View style={styles.directRow}>
          <TextInput value={direct} onChangeText={setDirect} onSubmitEditing={openDirect} returnKeyType="go" accessibilityLabel="Go to Bible reference" accessibilityHint="Enter a reference such as Romans 6:2" placeholder="Go to: Romans 6:2" placeholderTextColor="#898581" style={styles.searchInput} />
          <Pressable accessibilityRole="button" accessibilityLabel="Open typed Bible reference" onPress={openDirect} style={styles.searchButton}>
            <Ionicons name="arrow-forward" size={21} color={colors.tealInk} />
          </Pressable>
        </View>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={19} color={colors.muted} />
          <TextInput value={search} onChangeText={(value) => { setSearch(value); setSelectedBook(null); }} accessibilityLabel="Search Bible books" placeholder="Search books" placeholderTextColor="#898581" style={styles.searchField} />
        </View>
        <View style={styles.testamentRow} accessibilityRole="radiogroup" accessibilityLabel="Choose a Testament">
          {(["Old Testament", "New Testament"] as Testament[]).map((value) => (
            <Pressable key={value} accessibilityRole="radio" accessibilityLabel={value} accessibilityState={{ selected: testament === value }} onPress={() => { setTestament(value); setSelectedBook(null); }} style={[styles.testamentButton, testament === value && styles.testamentActive]}>
              <Text style={[styles.testamentText, testament === value && styles.testamentTextActive]}>{value}</Text>
            </Pressable>
          ))}
        </View>
        {selectedBook ? (
          <View style={styles.selectionArea}>
            <View style={styles.selectedHeading}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>{selectedBook.testament.toUpperCase()}</Text>
                <Text accessibilityRole="header" style={styles.selectedTitle}>{selectedBook.name}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Back to book list" onPress={() => setSelectedBook(null)} style={styles.backButton}><Text style={styles.backText}>All books</Text></Pressable>
            </View>
            <SectionTitle>Choose a chapter</SectionTitle>
            <FlatList
              key="chapter-grid"
              data={Array.from({ length: selectedBook.chapters }, (_, index) => index + 1)}
              numColumns={6}
              keyExtractor={(item) => `${selectedBook.name}-${item}`}
              contentContainerStyle={styles.chapterGrid}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item }) => (
                <Pressable accessibilityRole="radio" accessibilityLabel={`Chapter ${item}`} accessibilityState={{ selected: chapter === item }} onPress={() => setChapter(item)} style={[styles.chapterCell, chapter === item && styles.chapterSelected]}>
                  <Text style={[styles.chapterText, chapter === item && styles.chapterTextSelected]}>{item}</Text>
                </Pressable>
              )}
            />
            <SectionTitle>Choose a verse</SectionTitle>
            <TextInput value={verse} onChangeText={setVerse} keyboardType="number-pad" accessibilityLabel="Verse number" accessibilityHint="Enter a verse number" returnKeyType="done" style={styles.verseInput} />
            <View style={styles.previewRef}><Text style={styles.previewLabel}>SELECTED PASSAGE</Text><Text style={styles.previewValue}>{selectedBook.name} {chapter}:{verse || "—"}</Text></View>
            <PrimaryButton label="Open passage" icon="book-outline" onPress={openSelected} />
          </View>
        ) : (
          <FlatList
            key={testament}
            data={books}
            numColumns={2}
            keyExtractor={(item) => item.name}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.bookList}
            ListHeaderComponent={<Text style={styles.listHeading}>{testament}</Text>}
            ListEmptyComponent={<Text style={styles.empty}>No books match your search.</Text>}
            renderItem={({ item }) => {
              const selected = item.name === reference.book;
              return (
                <Pressable accessibilityRole="button" accessibilityLabel={`${item.name}, ${item.chapters} chapters`} accessibilityHint="Opens chapter selection" onPress={() => chooseBook(item)} style={({ pressed }) => [styles.bookCard, selected && styles.currentBook, pressed && { opacity: 0.75 }]}>
                  <Text style={styles.bookName}>{item.name}</Text>
                  <Text style={styles.chapterCount}>{item.chapters} chapters</Text>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 20, paddingTop: 18 },
  directRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  searchInput: { flex: 1, minHeight: 52, borderRadius: 10, paddingHorizontal: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text, fontSize: 16 },
  searchButton: { minWidth: 54, minHeight: 52, backgroundColor: colors.tealBright, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  searchRow: { height: 52, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, marginBottom: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10 },
  searchField: { flex: 1, color: colors.text, fontSize: 16, minHeight: 50 },
  testamentRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  testamentButton: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  testamentActive: { backgroundColor: "#261c0d", borderColor: colors.amber },
  testamentText: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  testamentTextActive: { color: colors.amberSoft },
  listHeading: { color: colors.amberSoft, fontSize: 19, fontWeight: "700", marginTop: 8, marginBottom: 12 },
  bookList: { paddingBottom: 22 },
  gridRow: { gap: 10, justifyContent: "space-between", marginBottom: 10 },
  bookCard: { flex: 1, minHeight: 82, padding: 13, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: "center" },
  currentBook: { borderColor: colors.amber, borderWidth: 1.5 },
  bookName: { color: colors.text, fontSize: 16, fontWeight: "600", marginBottom: 6 },
  chapterCount: { color: colors.amberSoft, fontSize: 12 },
  empty: { color: colors.muted, fontSize: 15, paddingVertical: 18 },
  selectionArea: { flex: 1 },
  selectedHeading: { flexDirection: "row", alignItems: "center", marginBottom: 10, marginTop: 3 },
  eyebrow: { color: colors.tealBright, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  selectedTitle: { color: colors.amber, fontSize: 25, fontWeight: "700", marginTop: 3 },
  backButton: { paddingVertical: 10, paddingHorizontal: 13, borderRadius: 8, backgroundColor: colors.surfaceRaised },
  backText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  chapterGrid: { paddingBottom: 4 },
  chapterCell: { flex: 1, height: 42, marginBottom: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  chapterSelected: { backgroundColor: colors.tealBright, borderColor: colors.tealBright },
  chapterText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  chapterTextSelected: { color: colors.tealInk },
  verseInput: { width: 130, minHeight: 50, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 9, paddingHorizontal: 14, color: colors.text, fontSize: 17, marginBottom: 12 },
  previewRef: { backgroundColor: colors.surface, borderRadius: 9, borderLeftWidth: 3, borderLeftColor: colors.amber, padding: 12, marginBottom: 12 },
  previewLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  previewValue: { color: colors.amberSoft, fontSize: 16, fontWeight: "700", marginTop: 5 },
});
