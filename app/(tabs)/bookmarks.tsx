import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Card, colors, PageTitle, PrimaryButton, Screen } from "@/components/light-ui";
import { formatReference, useAppState, type Bookmark } from "@/lib/app-state";

const LOCAL_EXCERPTS: Record<string, string> = {
  "Psalms 23:1": "The LORD is my shepherd; I shall not want.",
  "John 3:16": "For God so loved the world, that he gave his one and only Son...",
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
        <View style={styles.titleSection}>
          <PageTitle title="Bookmarks" subtitle="Your saved scriptures" />
        </View>
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
          ListFooterComponent={bookmarks.length > 0 ? (
            <View style={styles.syncStatus}>
              <Ionicons name="sync-outline" size={17} color={colors.tealBright} />
              <Text style={styles.syncText}>Saved on this device · Sync unavailable in preview</Text>
            </View>
          ) : null}
          renderItem={({ item }) => {
            const reference = formatReference(item);
            const excerpt = LOCAL_EXCERPTS[reference];
            return (
              <Card style={styles.bookmarkCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reference}>{reference}</Text>
                    <Text style={styles.version}>King James Version</Text>
                  </View>
                  <Ionicons name="bookmark" size={18} color={colors.tealBright} />
                </View>
                <Text style={styles.excerpt}>{excerpt ?? "Verse text is available when the offline KJV dataset is connected."}</Text>
                <View style={styles.cardActions}>
                  <View style={styles.savedLabel}><Ionicons name="calendar-outline" size={15} color={colors.muted} /><Text style={styles.savedText}>Local bookmark</Text></View>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Open ${reference} in reader`} accessibilityHint="Opens this verse in the Bible reader" onPress={() => open(item)} style={styles.openButton}>
                    <Ionicons name="play" size={17} color={colors.tealBright} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove bookmark for ${reference}`} onPress={() => removeBookmark(item.id)} style={styles.removeButton}>
                    <Ionicons name="trash-outline" size={18} color={colors.muted} />
                  </Pressable>
                </View>
              </Card>
            );
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 24, paddingTop: 34 },
  titleSection: { marginBottom: 2 },
  list: { paddingTop: 0, paddingBottom: 130, flexGrow: 1 },
  emptyWrap: { flex: 1, minHeight: 350, justifyContent: "center", alignItems: "center", paddingHorizontal: 14 },
  emptyIcon: { width: 66, height: 66, borderRadius: 16, backgroundColor: "#10211b", alignItems: "center", justifyContent: "center", marginBottom: 17 },
  emptyTitle: { color: colors.text, fontSize: 21, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center", marginBottom: 19 },
  bookmarkCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: "rgba(53,53,52,0.8)", borderRadius: 8, padding: 17, marginBottom: 14 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 13 },
  reference: { color: colors.amber, fontSize: 19, lineHeight: 25, fontWeight: "500", marginBottom: 3 },
  version: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  excerpt: { color: colors.text, fontSize: 17, lineHeight: 25, marginBottom: 13 },
  cardActions: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 9, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(53,53,52,0.65)" },
  savedLabel: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7 },
  savedText: { color: colors.muted, fontSize: 12 },
  openButton: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" },
  removeButton: { minWidth: 40, minHeight: 44, alignItems: "center", justifyContent: "center" },
  syncStatus: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 20, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.surface },
  syncText: { color: colors.muted, fontSize: 12, lineHeight: 17 },
});
