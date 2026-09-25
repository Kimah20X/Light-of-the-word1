import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, Field, Notice, PageTitle, PrimaryButton, Screen } from "@/components/light-ui";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || password.length < 1) {
      Alert.alert("Check your details", "Enter a valid email address and password.");
      return;
    }
    Alert.alert("Sign-in unavailable", "Authentication is not connected in this frontend preview. Your details were not sent or saved.");
  };
  return (
    <Screen>
      <PageTitle title="Welcome back" subtitle="Sign in to sync your reading progress and bookmarks." />
      <Notice>This account screen is a frontend preview. No credentials are sent or stored.</Notice>
      <View style={styles.form}>
        <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" accessibilityHint="Enter the email address for your account" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry autoComplete="current-password" accessibilityHint="Enter your account password" />
        <Pressable accessibilityRole="button" accessibilityLabel="Forgot password" onPress={() => Alert.alert("Password reset unavailable", "Connect an authentication service to enable password reset.")} style={styles.forgot}><Text style={styles.forgotText}>Forgot password?</Text></Pressable>
        <PrimaryButton label="Sign in" icon="log-in-outline" onPress={submit} hint="Validates the form; account sign-in is not connected in this preview" />
        <View style={styles.signupLine}><Text style={styles.muted}>New to Light of the Word?</Text><Pressable accessibilityRole="link" accessibilityLabel="Create a new account" onPress={() => router.push("/signup")}><Text style={styles.link}> Sign up</Text></Pressable></View>
        <Pressable accessibilityRole="link" accessibilityLabel="Return to profile" onPress={() => router.replace("/profile")} style={styles.back}><Text style={styles.backText}>Back to profile</Text></Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 4 },
  forgot: { minHeight: 44, alignSelf: "flex-end", justifyContent: "center", paddingHorizontal: 2, marginBottom: 8 },
  forgotText: { color: colors.tealBright, fontSize: 14, fontWeight: "600" },
  signupLine: { flexDirection: "row", justifyContent: "center", alignItems: "center", minHeight: 54, marginTop: 8 },
  muted: { color: colors.muted, fontSize: 14 },
  link: { color: colors.amberSoft, fontSize: 15, fontWeight: "700" },
  back: { minHeight: 46, alignItems: "center", justifyContent: "center" },
  backText: { color: colors.muted, fontSize: 14 },
});
