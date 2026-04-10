import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import OnboardingSlide from "@/components/onboarding/OnboardingSlide";
import { APP_ROUTES } from "@/constants/appRoute";
import { onboardingData } from "@/data/onboarding";

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastSlide = useMemo(
    () => currentIndex === onboardingData.length - 1,
    [currentIndex],
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (isLastSlide) {
      router.replace(APP_ROUTES.LOGIN);
      return;
    }

    flatListRef.current?.scrollToIndex({
      index: currentIndex + 1,
      animated: true,
    });
  };

  const handleSkip = () => {
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OnboardingSlide item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {!isLastSlide && (
        <View style={styles.topRight}>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Bỏ qua</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => {
            const active = index === currentIndex;
            return (
              <View
                key={index}
                style={[styles.dot, active && styles.activeDot]}
              />
            );
          })}
        </View>

        <Pressable onPress={handleNext} style={styles.nextButton}>
          <Text style={styles.nextText}>
            {isLastSlide ? "Bắt đầu" : "Tiếp tục"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  topRight: {
    position: "absolute",
    top: 45,
    right: 20,
    zIndex: 20,
  },
  skipButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  skipText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },

  footer: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 24,
    zIndex: 20,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  activeDot: {
    width: 34,
    backgroundColor: "#22c55e",
  },

  nextButton: {
    height: 60,
    borderRadius: 999,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
  },
});
