import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, colors, Notice, PageTitle, PrimaryButton, Screen, SectionTitle } from "@/components/light-ui";
import { formatReference, useAppState } from "@/lib/app-state";
import { useAuth } from "@/hooks/use-auth";

export default function ProfileScreen() {
  const { reference, bookmarks } = useAppState();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [message, setMessage] = useState("");

  const signOut = async () => {
    setLogoutBusy(true);
    setMessage("");
    await logout();
    setLogoutBusy(false);
    setMessage("You have signed out. Your reading and bookmarks remain on this device.");
  };

  return (
    <Screen>
      <PageTitle title="Your profile" subtitle="Account and reading progress." />
      {message ? <Notice>{message}</Notice> : isAuthenticated
        ? <Notice>Account sign-in is active. Your reading history and bookmarks are still stored locally; cloud sync has not been connected yet.</Notice>
        : !loading ? <Notice>Sign in or create an account. Your Bible reading and bookmarks work locally on this device.</Notice> : null}
      <Card highlighted>
        <View style={styles.profileHeading}>
          <View style={styles.avatar}><Ionicons name="person-outline" size={30} color={colors.tealBright} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.name || (isAuthenticated ? "Bible reader" : "Welcome")}</Text>
            <Text style={styles.profileStatus}>{loading ? "Checking account…" : isAuthenticated ? user?.email || "Signed in" : "Guest · this device"}</Text>
          </View>
        </View>
        {isAuthenticated ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Sign out" accessibilityHint="Revokes this session and signs out on this device" accessibilityState={{ disabled: logoutBusy }} disabled={logoutBusy} onPress={signOut} style={({ pressed }) => [styles.accountButton, pressed && styles.pressed, logoutBusy && styles.disabled]}>
            <Ionicons name="log-out-outline" size={19} color={colors.amber} />
            <Text style={styles.accountButtonText}>{logoutBusy ? "Signing out…" : "Sign out"}</Text>
          </Pressable>
        ) : (
          <>
            <PrimaryButton label="Sign in" icon="log-in-outline" onPress={() => router.push("/login")} hint="Opens the account sign-in screen" disabled={loading} />
            <Pressable accessibilityRole="link" accessibilityLabel="Create a new account" onPress={() => router.push("/signup")} style={styles.signup}>
              <Text style={styles.signupText}>Create an account</Text>
            </Pressable>
          </>
        )}
      </Card>
      <SectionTitle>Reading on this device</SectionTitle>
      <Card>
        <View style={styles.statRow}><Ionicons name="book-outline" size={20} color={colors.amber} /><Text style={styles.statLabel}>Current passage</Text><Text style={styles.statValue}>{formatReference(reference)}</Text></View>
        <View style={styles.divider} />
        <View style={styles.statRow}><Ionicons name="bookmark-outline" size={20} color={colors.tealBright} /><Text style={styles.statLabel}>Saved bookmarks</Text><Text style={styles.statValue}>{bookmarks.length}</Text></View>
        <View style={styles.divider} />
        <View style={styles.statRow}><Ionicons name="cloud-offline-outline" size={20} color={colors.tealBright} /><Text style={styles.statLabel}>Reading sync</Text><Text style={styles.localValue}>Local only</Text></View>
      </Card>
      <SectionTitle>Account</SectionTitle>
      <Card>
        <Pressable accessibilityRole="button" accessibilityLabel="Open app settings" onPress={() => router.navigate("/(tabs)/settings")} style={styles.settingLink}>
          <Ionicons name="settings-outline" size={21} color={colors.amberSoft} /><Text style={styles.settingText}>Language, audio &amp; display settings</Text><Ionicons name="chevron-forward" size={19} color={colors.muted} />
        </Pressable>
      </Card>
      <Text style={styles.footer}>LIGHT OF THE WORD</Text>
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
  accountButton: { minHeight: 54, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 9 },
  accountButtonText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  statRow: { minHeight: 49, flexDirection: "row", alignItems: "center", gap: 10 },
  statLabel: { flex: 1, color: colors.muted, fontSize: 14 },
  statValue: { color: colors.text, fontSize: 14, fontWeight: "700" },
  localValue: { color: colors.tealBright, fontSize: 13, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  settingLink: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 11 },
  settingText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" },
  footer: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 8, marginBottom: 10 },
});
