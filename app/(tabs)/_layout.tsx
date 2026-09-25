import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { colors } from "@/components/light-ui";

const ICONS = {
  index: "home-outline",
  navigate: "compass-outline",
  bookmarks: "bookmark-outline",
  settings: "settings-outline",
} as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 8 : Math.max(insets.bottom, 8);
  const tabBarHeight = 62 + bottomPadding;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.tealBright,
        tabBarInactiveTintColor: "#d7c3b1",
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 7,
          paddingBottom: bottomPadding,
          backgroundColor: "#131313",
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabel: ({ focused }) => (
          <Text style={[styles.label, focused && styles.activeLabel]}>{route.name === "index" ? "Home" : route.name === "navigate" ? "Navigate" : route.name === "bookmarks" ? "Bookmarks" : "Settings"}</Text>
        ),
        tabBarIcon: ({ focused }) => {
          const icon = ICONS[route.name as keyof typeof ICONS] ?? "ellipse-outline";
          return <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={21} color={focused ? colors.tealBright : "#d7c3b1"} />;
        },
        tabBarAccessibilityLabel: `${route.name === "index" ? "Home" : route.name}, tab`,
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="navigate" options={{ title: "Navigate" }} />
      <Tabs.Screen name="bookmarks" options={{ title: "Bookmarks" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: { color: "#d7c3b1", fontSize: 12, lineHeight: 16, marginTop: 2 },
  activeLabel: { color: colors.tealBright, fontWeight: "700" },
});
