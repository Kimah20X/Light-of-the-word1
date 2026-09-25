import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, Field, Notice, PageTitle, PrimaryButton, Screen } from "@/components/light-ui";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = () => {
    if (name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(email.trim()) || password.length < 8) {
      Alert.alert("Check your details", "Enter your name, a valid email address, and a password with at least 8 characters.");
      return;
    }
    Alert.alert("Account creation unavailable", "Authentication is not connected in this frontend preview. Your details were not sent or saved.");
  };
  return (
    <Screen>
      <PageTitle title="Create an account" subtitle="Keep your reading history and bookmarks in sync." />
      <Notice>Account creation is not connected yet. Form details stay on this screen and are never submitted.</Notice>
      <View style={styles.form}>
        <Field label="Your name" value={name} onChangeText={setName} placeholder="Name" autoComplete="name" accessibilityHint="Enter your name" />
        <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" accessibilityHint="Enter an email address" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry autoComplete="new-password" accessibilityHint="Choose a password with at least 8 characters" />
        <PrimaryButton label="Create account" icon="person-add-outline" onPress={submit} hint="Validates the form; account creation is not connected in this preview" />
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
