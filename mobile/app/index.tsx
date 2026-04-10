import { useAuthStore } from "@/stores/auth.store";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isHydrated, accessToken } = useAuthStore();

  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#020817",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  if (accessToken) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
