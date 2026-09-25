import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, colors, Notice, PageTitle, PrimaryButton, Screen, SectionTitle } from "@/components/light-ui";
import { formatReference, useAppState } from "@/lib/app-state";

export default function ProfileScreen() {
  const { reference, bookmarks } = useAppState();
  return (
    <Screen>
      <PageTitle title="Your profile" subtitle="Account and reading progress." />
      <Notice>You are using the local frontend preview. No account is signed in, and sync is unavailable.</Notice>
      <Card highlighted>
        <View style={styles.profileHeading}>
          <View style={styles.avatar}><Ionicons name="person-outline" size={30} color={colors.tealBright} /></View>
          <View style={{ flex: 1 }}><Text style={styles.profileName}>Welcome</Text><Text style={styles.profileStatus}>Guest · this device</Text></View>
        </View>
        <PrimaryButton label="Sign in" icon="log-in-outline" onPress={() => router.push("/login")} hint="Opens sign-in form" />
        <Pressable accessibilityRole="link" accessibilityLabel="Create a new account" onPress={() => router.push("/signup")} style={styles.signup}><Text style={styles.signupText}>Create an account</Text></Pressable>
      </Card>
      <SectionTitle>Reading on this device</SectionTitle>
      <Card>
        <View style={styles.statRow}><Ionicons name="book-outline" size={20} color={colors.amber} /><Text style={styles.statLabel}>Current passage</Text><Text style={styles.statValue}>{formatReference(reference)}</Text></View>
        <View style={styles.divider} />
        <View style={styles.statRow}><Ionicons name="bookmark-outline" size={20} color={colors.tealBright} /><Text style={styles.statLabel}>Saved bookmarks</Text><Text style={styles.statValue}>{bookmarks.length}</Text></View>
        <View style={styles.divider} />
        <View style={styles.statRow}><Ionicons name="cloud-offline-outline" size={20} color={colors.tealBright} /><Text style={styles.statLabel}>Sync status</Text><Text style={styles.localValue}>Local only</Text></View>
      </Card>
      <SectionTitle>Account</SectionTitle>
      <Card>
        <Pressable accessibilityRole="button" accessibilityLabel="Open app settings" onPress={() => router.navigate("/(tabs)/settings")} style={styles.settingLink}>
          <Ionicons name="settings-outline" size={21} color={colors.amberSoft} /><Text style={styles.settingText}>Language, audio & display settings</Text><Ionicons name="chevron-forward" size={19} color={colors.muted} />
        </Pressable>
      </Card>
      <Text style={styles.footer}>LIGHT OF THE WORD · Frontend preview</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileHeading: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 18 },
  avatar: { width: 58, height: 58, borderRadius: 18, backgroundColor: "#10211b", alignItems: "center", justifyContent: "center" },
  profileName: { color: colors.text, fontSize: 21, fontWeight: "700", marginBottom: 4 },
  profileStatus: { color: colors.muted, fontSize: 14 },
  signup: { minHeight: 47, alignItems: "center", justifyContent: "center", marginTop: 5 },
  signupText: { color: colors.amberSoft, fontSize: 15, fontWeight: "700" },
  statRow: { minHeight: 49, flexDirection: "row", alignItems: "center", gap: 10 },
  statLabel: { flex: 1, color: colors.muted, fontSize: 14 },
  statValue: { color: colors.text, fontSize: 14, fontWeight: "700" },
  localValue: { color: colors.tealBright, fontSize: 13, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  settingLink: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 11 },
  settingText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" },
  footer: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 8, marginBottom: 10 },
});
