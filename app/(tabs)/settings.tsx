import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Card, ChoiceChip, colors, Notice, PageTitle, Screen, SectionTitle } from "@/components/light-ui";
import { useAppState } from "@/lib/app-state";

function PreferenceRow({ title, detail, value, onValueChange, disabled = false }: { title: string; detail?: string; value: boolean; onValueChange?: (value: boolean) => void; disabled?: boolean }) {
  return (
    <View style={styles.preferenceRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        {detail ? <Text style={styles.preferenceDetail}>{detail}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} accessibilityRole="switch" accessibilityLabel={title} accessibilityState={{ checked: value, disabled }} trackColor={{ false: "#55504c", true: colors.teal }} thumbColor={value ? colors.tealBright : "#e4dfda"} />
    </View>
  );
}

export default function SettingsScreen() {
  const { preferences, updatePreferences } = useAppState();
  return (
    <Screen>
      <PageTitle title="Settings" subtitle="Adjust your reading experience on this device." />

      <SectionTitle>Account</SectionTitle>
      <Card>
        <Pressable accessibilityRole="button" accessibilityLabel="Open profile and sign-in options" onPress={() => router.push("/profile")} style={styles.accountRow}>
          <View style={styles.accountIcon}><Ionicons name="person-outline" size={22} color={colors.tealBright} /></View>
          <View style={{ flex: 1 }}><Text style={styles.accountTitle}>Profile & sign in</Text><Text style={styles.preferenceDetail}>Account features are not connected in this preview.</Text></View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
      </Card>

      <SectionTitle>Language</SectionTitle>
      <Card>
        <Text style={styles.cardLabel}>Choose your preferred language</Text>
        <View style={styles.chipWrap} accessibilityRole="radiogroup" accessibilityLabel="Language selection">
          {(["English", "Hausa", "Yoruba", "Igbo"] as const).map((language) => <ChoiceChip key={language} label={language} selected={preferences.language === language} onPress={() => updatePreferences({ language })} />)}
        </View>
        <Text style={styles.smallNote}>Language preference is saved locally. Only English interface text is included in this frontend preview.</Text>
      </Card>

      <SectionTitle>Audio & display</SectionTitle>
      <Card>
        <View style={styles.settingHeading}><Text style={styles.cardLabel}>Reading speed</Text><Text style={styles.valueText}>{preferences.speed.toFixed(1)}×</Text></View>
        <View style={styles.chipWrap} accessibilityRole="radiogroup" accessibilityLabel="Reading speed">
          {[0.75, 1, 1.25, 1.5].map((speed) => <ChoiceChip key={speed} label={`${speed}×`} selected={preferences.speed === speed} onPress={() => updatePreferences({ speed })} />)}
        </View>
        <View style={styles.divider} />
        <View style={styles.settingHeading}><Text style={styles.cardLabel}>Font size</Text><Text style={styles.valueText}>{preferences.fontSize <= 20 ? "Small" : preferences.fontSize <= 24 ? "Medium" : "Large"}</Text></View>
        <View style={styles.chipWrap} accessibilityRole="radiogroup" accessibilityLabel="Reader font size">
          {[18, 22, 27].map((fontSize) => <ChoiceChip key={fontSize} label={fontSize === 18 ? "A" : fontSize === 22 ? "A+" : "A++"} accessibilityLabel={`${fontSize === 18 ? "Small" : fontSize === 22 ? "Medium" : "Large"} text size`} selected={preferences.fontSize === fontSize} onPress={() => updatePreferences({ fontSize })} />)}
        </View>
      </Card>
      <Card>
        <PreferenceRow title="Auto-play chapters" detail="Continue reading aloud when a chapter ends" value={preferences.autoplay} onValueChange={(value) => updatePreferences({ autoplay: value })} />
        <View style={styles.divider} />
        <PreferenceRow title="Dark mode" detail="The current preview follows the dark Figma theme" value={preferences.darkMode} disabled />
      </Card>

      <SectionTitle>Bible & offline</SectionTitle>
      <Card>
        <View style={styles.statusRow}><Ionicons name="book-outline" size={20} color={colors.amber} /><View style={{ flex: 1 }}><Text style={styles.preferenceTitle}>King James Version</Text><Text style={styles.preferenceDetail}>Translation selected for this preview</Text></View><Text style={styles.valueText}>KJV</Text></View>
        <View style={styles.divider} />
        <View style={styles.statusRow}><Ionicons name="cloud-offline-outline" size={20} color={colors.tealBright} /><View style={{ flex: 1 }}><Text style={styles.preferenceTitle}>Offline status</Text><Text style={styles.preferenceDetail}>Bookmarks and preferences are stored on this device</Text></View><Text style={styles.readyText}>LOCAL</Text></View>
        <Notice>Offline KJV scripture data and cross-device sync are not connected in this frontend preview.</Notice>
      </Card>
      <Text style={styles.version}>LIGHT OF THE WORD · Frontend preview</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  accountRow: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 12 },
  accountIcon: { width: 43, height: 43, borderRadius: 10, backgroundColor: "#10211b", alignItems: "center", justifyContent: "center" },
  accountTitle: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 3 },
  cardLabel: { color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: 12 },
  chipWrap: { flexDirection: "row", gap: 9, flexWrap: "wrap" },
  smallNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 12 },
  settingHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  valueText: { color: colors.amberSoft, fontSize: 14, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 15 },
  preferenceRow: { minHeight: 61, flexDirection: "row", alignItems: "center", gap: 12 },
  preferenceTitle: { color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: 4 },
  preferenceDetail: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  statusRow: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 12 },
  readyText: { color: colors.tealBright, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  version: { color: colors.muted, fontSize: 12, textAlign: "center", marginVertical: 10 },
});
