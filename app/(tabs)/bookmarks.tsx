import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Card, colors, Notice, PageTitle, PrimaryButton, Screen } from "@/components/light-ui";
import { formatReference, useAppState, type Bookmark } from "@/lib/app-state";

const LOCAL_EXCERPTS: Record<string, string> = {
  "Psalms 23:1": "The LORD is my shepherd; I shall not want.",
  "John 3:16": "For God so loved the world, that he gave his only begotten Son...",
  "Romans 6:2": "God forbid. How shall we, that are dead to sin, live any longer therein?",
};

export default function BookmarksScreen() {
  const { bookmarks, setReference, removeBookmark } = useAppState();
  const open = (bookmark: Bookmark) => {
    setReference({ book: bookmark.book, chapter: bookmark.chapter, verse: bookmark.verse });
    router.navigate("/");
  };

  return (
    <Screen noScroll>
      <View style={styles.page}>
        <PageTitle title="Bookmarks" subtitle="Your saved scripture references stay on this device." />
        <Notice>These are local preview bookmarks. They are not synced to an account or server.</Notice>
        <FlatList
          data={[...bookmarks].reverse()}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={(
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}><Ionicons name="bookmark-outline" size={28} color={colors.tealBright} /></View>
              <Text accessibilityRole="header" style={styles.emptyTitle}>No bookmarks yet</Text>
              <Text style={styles.emptyText}>Save a verse in the reader and it will appear here.</Text>
              <PrimaryButton label="Return to reader" icon="book-outline" onPress={() => router.navigate("/")} />
            </View>
          )}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reference}>{formatReference(item)}</Text>
                  <Text style={styles.version}>King James Version · saved locally</Text>
                </View>
                <Ionicons name="bookmark" size={20} color={colors.tealBright} />
              </View>
              <Text style={styles.excerpt}>{LOCAL_EXCERPTS[formatReference(item)] ?? "Verse text is available when the offline KJV dataset is connected."}</Text>
              <View style={styles.cardActions}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Open ${formatReference(item)} in reader`} onPress={() => open(item)} style={styles.openButton}>
                  <Ionicons name="play" size={17} color={colors.tealBright} /><Text style={styles.openText}>Open passage</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove bookmark for ${formatReference(item)}`} onPress={() => removeBookmark(item.id)} style={styles.removeButton}>
                  <Ionicons name="trash-outline" size={18} color={colors.muted} />
                </Pressable>
              </View>
            </Card>
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 20, paddingTop: 18 },
  list: { paddingTop: 2, paddingBottom: 20, flexGrow: 1 },
  emptyWrap: { flex: 1, minHeight: 350, justifyContent: "center", alignItems: "center", paddingHorizontal: 14 },
  emptyIcon: { width: 66, height: 66, borderRadius: 16, backgroundColor: "#10211b", alignItems: "center", justifyContent: "center", marginBottom: 17 },
  emptyTitle: { color: colors.text, fontSize: 21, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center", marginBottom: 19 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 13 },
  reference: { color: colors.amberSoft, fontSize: 19, fontWeight: "700", marginBottom: 4 },
  version: { color: colors.muted, fontSize: 12 },
  excerpt: { color: colors.text, fontSize: 16, lineHeight: 25, marginBottom: 13 },
  cardActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  openButton: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 8 },
  openText: { color: colors.tealBright, fontSize: 14, fontWeight: "600" },
  removeButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
});
