import React from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

type AuthInputProps = TextInputProps & {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPressRightIcon?: () => void;
};

export default function Input({
  leftIcon,
  rightIcon,
  onPressRightIcon,
  style,
  ...props
}: AuthInputProps) {
  return (
    <View style={styles.container}>
      {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}

      <TextInput
        {...props}
        placeholderTextColor="#8A93A5"
        style={[styles.input, style]}
      />

      {rightIcon ? (
        onPressRightIcon ? (
          <Pressable onPress={onPressRightIcon} style={styles.rightIconButton}>
            {rightIcon}
          </Pressable>
        ) : (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1E293B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  leftIcon: {
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 18,
    paddingVertical: 0,
  },
  rightIcon: {
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rightIconButton: {
    marginLeft: 12,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
