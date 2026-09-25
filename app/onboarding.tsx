import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, PrimaryButton, Screen } from "@/components/light-ui";
import { FigmaBrandMark } from "@/components/figma-brand-mark";
import { useAppState } from "@/lib/app-state";

export default function OnboardingScreen() {
  const { setOnboardingComplete } = useAppState();

  const startReading = () => {
    setOnboardingComplete(true);
    router.replace("/");
  };

  return (
    <Screen hideHeader style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.logoTile}>
          <FigmaBrandMark width={59} height={52} />
        </View>
        <Text accessibilityRole="header" style={styles.brand}>LIGHT OF THE WORD</Text>
        <View style={styles.taglines}>
          <Text style={styles.hausa}>Haske ga duniya ta wurin Kalmar{"\n"}Allah.</Text>
          <View style={styles.divider} />
          <Text style={styles.english}>Light for the world through the Word of{"\n"}God.</Text>
        </View>
      </View>

      <View accessibilityLabel="Glowing Bible illustration" style={styles.artFrame}>
        <Image source={require("../assets/figma/1-498.webp")} contentFit="cover" style={styles.artwork} />
      </View>

      <View style={styles.actions}>
        <Text style={styles.voiceHint}>Tap below or say “Open Bible”</Text>
        <PrimaryButton label="GET STARTED" icon="play" tone="amber" onPress={startReading} hint="Open the Bible reader" />
        <Pressable accessibilityRole="button" accessibilityLabel="English and Hausa language settings" accessibilityHint="Opens language preferences" onPress={() => router.push("/(tabs)/settings")} style={({ pressed }) => [styles.languageShortcut, pressed && { opacity: 0.7 }]}>
          <Ionicons name="globe-outline" size={17} color={colors.muted} />
          <Text style={styles.languageText}>English / Hausa</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { width: "100%", alignItems: "center", paddingTop: 14 },
  logoTile: { width: 128, height: 128, borderRadius: 8, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginBottom: 30 },
  brand: { color: colors.amberStrong, fontSize: 16, lineHeight: 24, fontWeight: "800", letterSpacing: 1.3, textAlign: "center", marginBottom: 20 },
  taglines: { alignItems: "center", gap: 20 },
  hausa: { color: colors.text, fontSize: 20, lineHeight: 29, textAlign: "center" },
  english: { color: colors.amberSoft, fontSize: 20, lineHeight: 29, textAlign: "center" },
  divider: { width: 48, height: 1, backgroundColor: "#524436" },
  artFrame: { width: "100%", maxWidth: 384, height: 250, alignSelf: "center", marginVertical: 20, overflow: "hidden", borderRadius: 12, borderWidth: 1, borderColor: "#353534" },
  artwork: { width: "100%", height: "100%", opacity: 0.65 },
  actions: { width: "100%", gap: 16, paddingBottom: 28 },
  voiceHint: { color: colors.amberSoft, fontSize: 13, lineHeight: 20, textAlign: "center", paddingBottom: 4 },
  languageShortcut: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  languageText: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
