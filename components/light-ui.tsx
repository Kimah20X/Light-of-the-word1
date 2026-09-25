import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FigmaBrandMark } from "@/components/figma-brand-mark";
import { useAppState } from "@/lib/app-state";

export const colors = {
  background: "#000000",
  surface: "#201f1f",
  surfaceRaised: "#2a2a2a",
  border: "#353534",
  text: "#e5e2e1",
  muted: "#d7c3b1",
  amber: "#ffb869",
  amberStrong: "#ba7517",
  amberInk: "#3f2300",
  amberSoft: "#d7c3b1",
  teal: "#26a37a",
  tealBright: "#68dbae",
  tealInk: "#003121",
  danger: "#f27676",
  black: "#000000",
};

export function Screen({ children, noScroll = false, hideHeader = false, compactHeader = false, offlineStatus, style }: { children: React.ReactNode; noScroll?: boolean; hideHeader?: boolean; compactHeader?: boolean; offlineStatus?: string; style?: ViewStyle }) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.safe, style]}>
      {offlineStatus ? <View style={styles.statusBar} accessibilityRole="text"><Ionicons name="cloud-offline-outline" size={16} color={colors.tealBright} /><Text style={styles.statusText}>{offlineStatus}</Text></View> : null}
      {!hideHeader ? <BrandHeader compact={compactHeader} /> : null}
      {noScroll ? <View style={styles.content}>{children}</View> : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scrollContent, compactHeader && styles.compactScrollContent]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export function BrandHeader({ back = false, compact = false }: { back?: boolean; compact?: boolean }) {
  const { preferences } = useAppState();
  const languageCode = preferences.language === "English" ? "EN" : preferences.language.slice(0, 2).toUpperCase();
  return (
    <View style={[styles.header, compact && styles.compactHeader]}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={23} color={colors.amberSoft} />
        </Pressable>
      ) : <FigmaBrandMark width={24} height={22} />}
      <Text style={styles.brand} accessibilityRole="header">Light of the Word</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Language preferences, ${preferences.language} selected`} accessibilityHint="Opens language options" onPress={() => router.push("/(tabs)/settings")} style={styles.languagePill}>
        <Text style={styles.languagePillText}>{languageCode}</Text>
      </Pressable>
    </View>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.titleBlock}>
      <Text accessibilityRole="header" style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, style, highlighted = false }: { children: React.ReactNode; style?: ViewStyle; highlighted?: boolean }) {
  return <View style={[styles.card, highlighted && styles.cardHighlighted, style]}>{children}</View>;
}

export function PrimaryButton({ label, onPress, icon, hint, disabled = false, tone = "teal" }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; hint?: string; disabled?: boolean; tone?: "teal" | "amber" }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, tone === "amber" && styles.primaryButtonAmber, pressed && styles.pressed, disabled && styles.disabled]}>
      {icon ? <Ionicons name={icon} size={20} color={tone === "amber" ? colors.amberInk : colors.tealInk} /> : null}
      <Text style={[styles.primaryButtonText, tone === "amber" && styles.primaryButtonTextAmber]}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, icon, hint }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; hint?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
      {icon ? <Ionicons name={icon} size={18} color={colors.amber} /> : null}
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ label, icon, onPress, selected = false, size = 22, hint }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; selected?: boolean; size?: number; hint?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.iconButton, selected && styles.iconButtonSelected, pressed && styles.pressed]}>
      <Ionicons name={icon} size={size} color={selected ? colors.tealInk : colors.text} />
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, placeholder, secureTextEntry = false, keyboardType = "default", autoCapitalize = "sentences", hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  const inputProps: TextInputProps = {
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    autoCorrect: false,
    returnKeyType: "done",
    placeholderTextColor: "#898581",
    ...props,
  };
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...inputProps} accessibilityLabel={label} accessibilityHint={hint} style={styles.input} />
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text accessibilityRole="header" style={styles.sectionTitle}>{children}</Text>;
}

export function ChoiceChip({ label, selected, onPress, accessibilityLabel }: { label: string; selected: boolean; onPress: () => void; accessibilityLabel?: string }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function Notice({ children }: { children: string }) {
  return (
    <View accessibilityRole="alert" style={styles.notice}>
      <Ionicons name="information-circle-outline" size={20} color={colors.amber} />
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: "100%", maxWidth: 390, alignSelf: "center", backgroundColor: colors.background },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120, width: "100%", maxWidth: 390, alignSelf: "center" },
  compactScrollContent: { paddingTop: 0 },
  statusBar: { height: 30, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0e0e0e", borderBottomWidth: 1, borderBottomColor: colors.border },
  statusText: { color: colors.text, fontSize: 13, lineHeight: 18 },
  header: { height: 72, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: "#131313" },
  compactHeader: { height: 54 },
  brand: { flex: 1, fontSize: 20, fontWeight: "700", color: colors.amber, letterSpacing: 0.15 },
  languagePill: { minWidth: 48, minHeight: 44, paddingHorizontal: 12, justifyContent: "center", alignItems: "center", borderColor: colors.amber, borderWidth: 1, borderRadius: 6 },
  languagePillText: { color: colors.amber, fontSize: 13, fontWeight: "700" },
  headerAction: { width: 44, height: 44, justifyContent: "center" },
  titleBlock: { marginBottom: 22, gap: 7 },
  pageTitle: { color: colors.text, fontSize: 32, lineHeight: 40, fontWeight: "600" },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 17, marginBottom: 14 },
  cardHighlighted: { borderColor: colors.amber, borderWidth: 2 },
  primaryButton: { minHeight: 54, borderRadius: 10, backgroundColor: colors.tealBright, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 },
  primaryButtonAmber: { minHeight: 72, backgroundColor: colors.amberStrong, borderRadius: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 7, elevation: 4 },
  primaryButtonText: { color: colors.tealInk, fontSize: 16, fontWeight: "700" },
  primaryButtonTextAmber: { color: colors.amberInk, textTransform: "uppercase", letterSpacing: 0.6 },
  secondaryButton: { minHeight: 50, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 },
  secondaryButtonText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  iconButton: { minWidth: 48, minHeight: 48, backgroundColor: colors.surfaceRaised, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  iconButtonSelected: { backgroundColor: colors.tealBright, borderColor: colors.tealBright },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  fieldWrap: { gap: 7, marginBottom: 14 },
  fieldLabel: { color: colors.text, fontSize: 15, fontWeight: "600" },
  input: { minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surface, color: colors.text, fontSize: 16 },
  sectionTitle: { color: colors.amberSoft, fontSize: 18, lineHeight: 24, fontWeight: "700", marginTop: 8, marginBottom: 12 },
  chip: { minHeight: 44, minWidth: 58, paddingHorizontal: 14, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipSelected: { borderColor: colors.tealBright, backgroundColor: colors.tealBright },
  chipText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  chipTextSelected: { color: colors.tealInk },
  notice: { flexDirection: "row", gap: 10, alignItems: "flex-start", borderRadius: 10, borderWidth: 1, borderColor: "#775820", backgroundColor: "#21190d", padding: 13, marginBottom: 14 },
  noticeText: { flex: 1, color: "#ead6b5", fontSize: 14, lineHeight: 20 },
});
