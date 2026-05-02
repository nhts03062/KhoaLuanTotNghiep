import { Ionicons } from "@expo/vector-icons";
import { Href, router, usePathname, useSegments } from "expo-router";
import {
  DevSettings,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ReloadFloatingButton() {
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  // Root index instantly redirects, so showing reload there is unnecessary.
  if (pathname === "/") {
    return null;
  }

  const isTabsScreen = segments.includes("(tabs)");
  const bottomOffset = isTabsScreen ? 110 : 24;

  const handleReload = () => {
    if (__DEV__) {
      DevSettings.reload();
      return;
    }

    router.replace(pathname as Href);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          bottom: bottomOffset + Math.max(insets.bottom, 0),
        },
      ]}
    >
      <Pressable
        onPress={handleReload}
        android_ripple={{ color: "rgba(255,255,255,0.16)", borderless: false }}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <Ionicons name="refresh" size={18} color="#E5E7EB" />
        <Text style={styles.text}>Reload</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    zIndex: 99,
  },
  button: {
    minWidth: 100,
    height: 46,
    borderRadius: 999,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(11,18,32,0.86)",
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [
      {
        scale: Platform.select({
          ios: 0.98,
          android: 0.99,
          default: 0.98,
        }) as number,
      },
    ],
  },
  text: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
