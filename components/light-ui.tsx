import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const colors = {
  background: "#050505",
  surface: "#1b1b1d",
  surfaceRaised: "#222224",
  border: "#353534",
  text: "#f1efed",
  muted: "#b7b2ae",
  amber: "#f5aa24",
  amberSoft: "#d7ad78",
  teal: "#26a37a",
  tealBright: "#68dbae",
  tealInk: "#003121",
  danger: "#f27676",
  black: "#000000",
};

export function Screen({ children, noScroll = false, style }: { children: React.ReactNode; noScroll?: boolean; style?: ViewStyle }) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.safe, style]}>
      <BrandHeader />
      {noScroll ? <View style={styles.content}>{children}</View> : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export function BrandHeader({ back = false }: { back?: boolean }) {
  return (
    <View style={styles.header}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={23} color={colors.amberSoft} />
        </Pressable>
      ) : <Ionicons name="book" size={21} color={colors.amber} accessibilityLabel="Bible" />}
      <Text style={styles.brand} accessibilityRole="header">Light of the Word</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Language preferences, English selected" accessibilityHint="Opens language options" onPress={() => router.push("/(tabs)/settings")} style={styles.languagePill}>
        <Text style={styles.languagePillText}>EN</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Open profile" accessibilityHint="Opens your profile and account options" onPress={() => router.push("/profile")} style={styles.profileAction}>
        <Ionicons name="person-circle-outline" size={27} color={colors.tealBright} />
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

export function PrimaryButton({ label, onPress, icon, hint, disabled = false }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; hint?: string; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, disabled && styles.disabled]}>
      {icon ? <Ionicons name={icon} size={20} color={colors.tealInk} /> : null}
      <Text style={styles.primaryButtonText}>{label}</Text>
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
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36, width: "100%", maxWidth: 640, alignSelf: "center" },
  header: { height: 58, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background },
  brand: { flex: 1, fontSize: 18, fontWeight: "700", color: colors.amberSoft, letterSpacing: 0.2 },
  languagePill: { minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center", borderColor: "#987035", borderWidth: 1, borderRadius: 8 },
  languagePillText: { color: colors.amberSoft, fontSize: 13, fontWeight: "700" },
  headerAction: { width: 44, height: 44, justifyContent: "center" },
  profileAction: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  titleBlock: { marginBottom: 22, gap: 7 },
  pageTitle: { color: colors.text, fontSize: 28, lineHeight: 35, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 17, marginBottom: 14 },
  cardHighlighted: { borderColor: colors.amber, borderWidth: 1.5 },
  primaryButton: { minHeight: 54, borderRadius: 10, backgroundColor: colors.tealBright, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 },
  primaryButtonText: { color: colors.tealInk, fontSize: 16, fontWeight: "700" },
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
