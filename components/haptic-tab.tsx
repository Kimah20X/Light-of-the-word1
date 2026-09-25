import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { StyleSheet, View } from "react-native";
import { usePathname } from "expo-router";
import * as Haptics from "expo-haptics";

export function HapticTab({ routeName, ...props }: BottomTabBarButtonProps & { routeName: string }) {
  const pathname = usePathname().toLowerCase();
  const selected = routeName === "index"
    ? pathname === "/" || pathname === "/(tabs)"
    : pathname.includes(`/${routeName.toLowerCase()}`);

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    >
      <View style={[styles.tile, selected && styles.activeTile]}>
        {props.children}
      </View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  tile: { width: 72, height: 72, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  activeTile: { backgroundColor: "#26a37a" },
});
