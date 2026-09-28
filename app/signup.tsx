import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, Field, Notice, PageTitle, PrimaryButton, Screen } from "@/components/light-ui";
import { registerPasswordAccount } from "@/lib/_core/api";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async () => {
    setMessage("");
    if (name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(email.trim()) || password.length < 10) {
      setMessage("Enter your name, a valid email address, and a password with at least 10 characters.");
      return;
    }
    setBusy(true);
    try {
      await registerPasswordAccount({ name: name.trim(), email: email.trim(), password });
      router.replace("/profile");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create an account. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <PageTitle title="Create an account" subtitle="Sign up to create a LIGHT OF THE WORD account." />
      {message ? <Notice>{message}</Notice> : <Notice>Passwords are hashed on the server.</Notice>}
      <View style={styles.form}>
        <Field label="Your name" value={name} onChangeText={setName} placeholder="Name" autoComplete="name" textContentType="name" accessibilityHint="Enter your name" editable={!busy} />
        <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" accessibilityHint="Enter an email address" editable={!busy} />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 10 characters" secureTextEntry autoComplete="new-password" textContentType="newPassword" accessibilityHint="Choose a password with at least 10 characters" editable={!busy} onSubmitEditing={submit} />
        <PrimaryButton label={busy ? "Creating account…" : "Create account"} icon="person-add-outline" onPress={submit} disabled={busy} hint="Creates a Light of the Word account" />
        <View style={styles.loginLine}><Text style={styles.muted}>Already have an account?</Text><Pressable accessibilityRole="link" accessibilityLabel="Go to sign in" onPress={() => router.replace("/login")}><Text style={styles.link}> Sign in</Text></Pressable></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 4 },
  loginLine: { flexDirection: "row", alignItems: "center", justifyContent: "center", minHeight: 54, marginTop: 8 },
  muted: { color: colors.muted, fontSize: 14 },
  link: { color: colors.amberSoft, fontSize: 15, fontWeight: "700" },
});
