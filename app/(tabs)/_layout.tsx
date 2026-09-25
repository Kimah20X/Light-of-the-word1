import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname } from "expo-router";
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
  const pathname = usePathname();
  const bottomPadding = Platform.OS === "web" ? 8 : Math.max(insets.bottom, 8);
  const tabBarHeight = 72 + bottomPadding;

  return (
    <Tabs
      screenOptions={({ route }) => {
        const routeName = route.name === "index" ? "Home" : route.name === "navigate" ? "Navigate" : route.name === "bookmarks" ? "Bookmarks" : "Settings";
        const focused = route.name === "index" ? pathname === "/" : pathname.toLowerCase().includes(route.name.toLowerCase());
        return ({
        headerShown: false,
        tabBarButton: (props) => <HapticTab {...props} routeName={route.name} />,
        tabBarActiveTintColor: colors.tealInk,
        tabBarInactiveTintColor: "#d7c3b1",
        tabBarStyle: {
          height: tabBarHeight,
          width: "100%",
          maxWidth: 390,
          alignSelf: "center",
          paddingTop: 4,
          paddingBottom: bottomPadding,
          backgroundColor: "#131313",
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          flexDirection: "row",
          justifyContent: "center",
        },
        tabBarItemStyle: { flex: 1, height: 72, marginHorizontal: 3, marginVertical: 0, borderRadius: 8, justifyContent: "center", alignItems: "center" },
        tabBarLabel: ({ focused }) => (
          <Text style={[styles.label, focused && styles.activeLabel]}>{routeName}</Text>
        ),
        tabBarIcon: ({ focused }) => {
          const icon = ICONS[route.name as keyof typeof ICONS] ?? "ellipse-outline";
          return <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={focused ? colors.tealInk : "#d7c3b1"} />;
        },
        tabBarAccessibilityLabel: `${route.name === "index" ? "Home" : route.name}, tab`,
      });
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="navigate" options={{ title: "Navigate" }} />
      <Tabs.Screen name="bookmarks" options={{ title: "Bookmarks" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: { color: "#d7c3b1", fontSize: 12, lineHeight: 16, marginTop: 3 },
  activeLabel: { color: colors.tealInk, fontWeight: "700" },
});
