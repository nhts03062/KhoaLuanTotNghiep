import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  icon: React.ReactNode;
  active?: boolean;
};

export default function CategoryItem({ title, icon, active = false }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.iconBox, active && styles.iconBoxActive]}>
        {icon}
      </View>
      <Text style={[styles.label, active && styles.labelActive]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginRight: 18,
  },
  iconBox: {
    width: 112,
    height: 112,
    borderRadius: 24,
    backgroundColor: "#1A2332",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  iconBoxActive: {
    backgroundColor: "#22C55E",
  },
  label: {
    color: "#8A93A5",
    fontSize: 16,
    fontWeight: "500",
  },
  labelActive: {
    color: "#F8FAFC",
  },
});
