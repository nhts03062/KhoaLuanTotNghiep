import type { OnboardingItem } from "@/data/onboarding";
import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

type Props = {
  item: OnboardingItem;
};

export default function OnboardingSlide({ item }: Props) {
  return (
    <View style={styles.container}>
      <Image source={item.image} style={styles.image} resizeMode="cover" />
      <View style={styles.overlay} />

      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height,
    backgroundColor: "#000",
    justifyContent: "flex-end",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 220,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 14,
  },
  description: {
    fontSize: 18,
    lineHeight: 30,
    color: "rgba(255,255,255,0.82)",
    maxWidth: "95%",
  },
});
