import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  category: string;
  image: any;
};

export default function FeaturedWorkoutCard({ title, category, image }: Props) {
  return (
    <ImageBackground
      source={image}
      style={styles.card}
      imageStyle={styles.image}
    >
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.category}>{category}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 390,
    marginRight: 16,
    justifyContent: "flex-end",
  },
  image: {
    borderRadius: 28,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  category: {
    color: "#19F07C",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
  },
});
