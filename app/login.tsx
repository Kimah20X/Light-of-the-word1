import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, Field, Notice, PageTitle, PrimaryButton, Screen } from "@/components/light-ui";
import { loginWithPassword } from "@/lib/_core/api";
import { startOAuthLogin } from "@/constants/oauth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async () => {
    setMessage("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || password.length < 1) {
      setMessage("Enter a valid email address and password.");
      return;
    }
    setBusy(true);
    try {
      await loginWithPassword({ email: email.trim(), password });
      router.replace("/profile");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign in. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <PageTitle title="Welcome back" subtitle="Sign in to your LIGHT OF THE WORD account." />
      {message ? <Notice>{message}</Notice> : <Notice>Your credentials are sent securely to the account server and are not stored on this screen.</Notice>}
      <View style={styles.form}>
        <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" accessibilityHint="Enter the email address for your account" editable={!busy} />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry autoComplete="current-password" textContentType="password" accessibilityHint="Enter your account password" editable={!busy} onSubmitEditing={submit} />
        <PrimaryButton label={busy ? "Signing in…" : "Sign in"} icon="log-in-outline" onPress={submit} disabled={busy} hint="Signs in to your Light of the Word account" />
        <Pressable accessibilityRole="button" accessibilityLabel="Continue with Manus" accessibilityHint="Opens the existing secure Manus sign-in" onPress={() => { void startOAuthLogin().catch(() => setMessage("Could not open Manus sign-in. Please try again.")); }} style={({ pressed }) => [styles.oauthButton, pressed && styles.pressed]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.tealBright} />
          <Text style={styles.oauthText}>Continue with Manus</Text>
        </Pressable>
        <View style={styles.signupLine}><Text style={styles.muted}>New to Light of the Word?</Text><Pressable accessibilityRole="link" accessibilityLabel="Create a new account" onPress={() => router.push("/signup")}><Text style={styles.link}> Sign up</Text></Pressable></View>
        <Pressable accessibilityRole="link" accessibilityLabel="Return to profile" onPress={() => router.replace("/profile")} style={styles.back}><Text style={styles.backText}>Back to profile</Text></Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 4 },
  signupLine: { flexDirection: "row", justifyContent: "center", alignItems: "center", minHeight: 54, marginTop: 8 },
  muted: { color: colors.muted, fontSize: 14 },
  link: { color: colors.amberSoft, fontSize: 15, fontWeight: "700" },
  back: { minHeight: 46, alignItems: "center", justifyContent: "center" },
  backText: { color: colors.muted, fontSize: 14 },
  oauthButton: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginTop: 7 },
  oauthText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  pressed: { opacity: 0.74 },
});
