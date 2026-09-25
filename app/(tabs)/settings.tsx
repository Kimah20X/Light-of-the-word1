import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { colors, Screen } from "@/components/light-ui";
import { useAppState } from "@/lib/app-state";
import { useAuth } from "@/hooks/use-auth";

const LANGUAGES = ["English", "Hausa", "Yoruba", "Igbo"] as const;
const SPEEDS = [0.75, 1, 1.25, 1.5] as const;
const FONT_SIZES = [18, 22, 27] as const;

type Language = (typeof LANGUAGES)[number];

function SectionHeading({ children }: { children: string }) {
  return <Text accessibilityRole="header" style={styles.sectionHeading}>{children}</Text>;
}

function PreferenceRow({ title, detail, value, icon, onValueChange, disabled = false }: { title: string; detail?: string; value: boolean; icon: keyof typeof Ionicons.glyphMap; onValueChange?: (value: boolean) => void; disabled?: boolean }) {
  return (
    <View style={styles.preferenceRow}>
      <Ionicons name={icon} size={20} color={colors.tealBright} />
      <View style={{ flex: 1 }}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        {detail ? <Text style={styles.preferenceDetail}>{detail}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} accessibilityRole="switch" accessibilityLabel={title} accessibilityState={{ checked: value, disabled }} trackColor={{ false: "#55504c", true: colors.teal }} thumbColor={value ? colors.tealBright : "#e4dfda"} />
    </View>
  );
}

export default function SettingsScreen() {
  const { preferences, updatePreferences, setOnboardingComplete } = useAppState();
  const { user, isAuthenticated, loading } = useAuth();
  return (
    <Screen>
      <View style={styles.page}>
        <View style={styles.section}>
          <SectionHeading>ACCOUNT</SectionHeading>
          <Pressable accessibilityRole="button" accessibilityLabel="Sign in and account profile" accessibilityHint="Opens profile, login, and account options" onPress={() => router.push("/profile")} style={styles.accountRow}>
            <Ionicons name="person-circle-outline" size={22} color={colors.tealBright} />
            <View style={{ flex: 1 }}>
              <Text style={styles.accountTitle}>{loading ? "Checking account…" : isAuthenticated ? user?.name || "Account" : "Sign In"}</Text>
              <Text style={styles.preferenceDetail}>{loading ? "Checking your sign-in status" : isAuthenticated ? user?.email || "Signed in · reading stays local" : "Sign in or create an account"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <SectionHeading>LANGUAGE</SectionHeading>
          <View style={styles.languageList} accessibilityRole="radiogroup" accessibilityLabel="Language selection">
            {LANGUAGES.map((language: Language) => {
              const selected = preferences.language === language;
              return (
                <Pressable key={language} accessibilityRole="radio" accessibilityLabel={language} accessibilityState={{ selected }} onPress={() => updatePreferences({ language })} style={styles.languageRow}>
                  <Text style={styles.languageText}>{language}</Text>
                  <View style={[styles.radioOuter, selected && styles.radioSelected]}>{selected ? <Ionicons name="checkmark" size={15} color={colors.amberInk} /> : null}</View>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.smallNote}>Language preference is saved locally. English, Hausa, Yoruba, and Igbo are ready for interface translations.</Text>
        </View>

        <View style={styles.section}>
          <SectionHeading>AUDIO &amp; DISPLAY</SectionHeading>
          <View style={styles.controlCard}>
            <View style={styles.controlHeading}>
              <View style={styles.controlTitleWrap}><Ionicons name="speedometer-outline" size={20} color={colors.tealBright} /><Text style={styles.controlTitle}>Reading Speed</Text></View>
              <Text style={styles.valueText}>{preferences.speed.toFixed(1)}×</Text>
            </View>
            <View style={styles.sliderTrack} accessibilityRole="radiogroup" accessibilityLabel="Reading speed">
              <View style={[styles.sliderProgress, { width: `${Math.max(12, Math.min(100, ((preferences.speed - 0.5) / 1.5) * 100))}%` }]} />
              <View style={styles.sliderStops}>
                {SPEEDS.map((speed) => <Pressable key={speed} accessibilityRole="radio" accessibilityLabel={`${speed} times reading speed`} accessibilityState={{ selected: preferences.speed === speed }} onPress={() => updatePreferences({ speed })} style={styles.speedStop}><View style={[styles.stopMark, preferences.speed === speed && styles.stopMarkSelected]} /></Pressable>)}
              </View>
            </View>
            <View style={styles.scaleLabels}>{SPEEDS.map((speed) => <Text key={speed} style={styles.scaleText}>{speed}×</Text>)}</View>
            <View style={styles.divider} />
            <View style={styles.controlHeading}>
              <View style={styles.controlTitleWrap}><Ionicons name="text-outline" size={20} color={colors.tealBright} /><Text style={styles.controlTitle}>Font Size</Text></View>
              <Text style={styles.valueText}>{preferences.fontSize === 18 ? "Small" : preferences.fontSize === 22 ? "Medium" : "Large"}</Text>
            </View>
            <View style={styles.sliderTrack} accessibilityRole="radiogroup" accessibilityLabel="Reader font size">
              <View style={[styles.sliderProgress, { width: preferences.fontSize === 18 ? "5%" : preferences.fontSize === 22 ? "50%" : "100%" }]} />
              <View style={styles.sliderStops}>
                {FONT_SIZES.map((fontSize, index) => <Pressable key={fontSize} accessibilityRole="radio" accessibilityLabel={`${index === 0 ? "Small" : index === 1 ? "Medium" : "Large"} text size`} accessibilityState={{ selected: preferences.fontSize === fontSize }} onPress={() => updatePreferences({ fontSize })} style={styles.speedStop}><Text style={[styles.fontStopText, { fontSize: index === 0 ? 14 : index === 1 ? 18 : 23 }]}>A</Text></Pressable>)}
              </View>
            </View>
          </View>
          <View style={styles.toggleCard}>
            <PreferenceRow title="Auto-play Chapters" value={preferences.autoplay} icon="play-circle-outline" onValueChange={(value) => updatePreferences({ autoplay: value })} />
            <View style={styles.divider} />
            <PreferenceRow title="Dark Mode" value={preferences.darkMode} icon="moon-outline" disabled />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading>ABOUT</SectionHeading>
          <View style={styles.aboutCard}>
            <View style={styles.aboutRow}><Text style={styles.aboutTitle}>Version</Text><Text style={styles.aboutDetail}>Preview</Text></View>
            <View style={styles.aboutRow}><View style={styles.controlTitleWrap}><Ionicons name="cloud-offline-outline" size={18} color={colors.tealBright} /><Text style={styles.aboutTitle}>Offline Status</Text></View><Text style={styles.offlineValue}>Local</Text></View>
            <Text style={styles.smallNote}>Bookmarks and preferences are saved on this device. Full offline KJV verse data and account sync are not part of this frontend preview.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Reopen onboarding guide" onPress={() => { setOnboardingComplete(false); router.push("/onboarding"); }} style={styles.guideLink}><Ionicons name="information-circle-outline" size={18} color={colors.amber} /><Text style={styles.guideText}>View onboarding guide</Text></Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { width: "100%", maxWidth: 390, alignSelf: "center", paddingHorizontal: 0, paddingTop: 0, paddingBottom: 20, gap: 24 },
  section: { gap: 12 },
  sectionHeading: { color: colors.muted, fontSize: 13, lineHeight: 19, fontWeight: "500", letterSpacing: 0.8 },
  accountRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 15, paddingHorizontal: 10 },
  accountTitle: { color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: "600", marginBottom: 2 },
  preferenceTitle: { color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: "600" },
  preferenceDetail: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  languageList: { gap: 3 },
  languageRow: { minHeight: 45, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 8 },
  languageText: { color: colors.text, fontSize: 17, lineHeight: 23, fontWeight: "500" },
  radioOuter: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#9f8e7d", borderRadius: 10 },
  radioSelected: { backgroundColor: colors.amberStrong, borderColor: colors.amberStrong },
  smallNote: { color: colors.muted, fontSize: 12, lineHeight: 17, paddingHorizontal: 4 },
  controlCard: { paddingHorizontal: 18, paddingVertical: 20, borderRadius: 9, backgroundColor: colors.surface, gap: 12 },
  controlHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  controlTitleWrap: { flexDirection: "row", alignItems: "center", gap: 14 },
  controlTitle: { color: colors.text, fontSize: 17, lineHeight: 23, fontWeight: "500" },
  valueText: { color: colors.amber, fontSize: 14, fontWeight: "700" },
  sliderTrack: { height: 9, borderRadius: 8, backgroundColor: colors.border, position: "relative", justifyContent: "center", marginTop: 3 },
  sliderProgress: { position: "absolute", left: 0, height: 9, borderRadius: 8, backgroundColor: colors.teal },
  sliderStops: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  speedStop: { minWidth: 30, minHeight: 34, alignItems: "center", justifyContent: "center" },
  stopMark: { width: 11, height: 11, borderRadius: 8, borderWidth: 1.5, borderColor: colors.muted, backgroundColor: colors.surface },
  stopMarkSelected: { width: 15, height: 15, borderColor: colors.tealBright, backgroundColor: colors.tealBright },
  scaleLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: -5 },
  scaleText: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  fontStopText: { color: colors.muted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 9 },
  toggleCard: { paddingHorizontal: 17, paddingVertical: 6, borderRadius: 9, backgroundColor: colors.surface },
  preferenceRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 14 },
  aboutCard: { padding: 17, borderRadius: 9, backgroundColor: colors.surface, gap: 16 },
  aboutRow: { minHeight: 30, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  aboutTitle: { color: colors.text, fontSize: 17, lineHeight: 23, fontWeight: "500" },
  aboutDetail: { color: colors.muted, fontSize: 13 },
  offlineValue: { color: colors.tealBright, fontSize: 13, fontWeight: "700" },
  guideLink: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 },
  guideText: { color: colors.amberSoft, fontSize: 14, fontWeight: "600" },
});
