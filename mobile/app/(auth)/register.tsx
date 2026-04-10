import Input from "@/components/input/input";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = () => {
    console.log("Register:", {
      fullName,
      email,
      password,
      confirmPassword,
    });

    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Tạo tài khoản mới 🚀</Text>
              <Text style={styles.subtitle}>
                Đăng ký để bắt đầu hành trình fitness của bạn
              </Text>
            </View>

            <View style={styles.form}>
              <Input
                value={fullName}
                onChangeText={setFullName}
                placeholder="Họ và tên"
                autoCapitalize="words"
                autoCorrect={false}
                leftIcon={
                  <Ionicons name="person-outline" size={24} color="#8A93A5" />
                }
              />

              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={<Feather name="mail" size={24} color="#8A93A5" />}
              />

              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Mật khẩu"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={24}
                    color="#8A93A5"
                  />
                }
                rightIcon={
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color="#8A93A5"
                  />
                }
                onPressRightIcon={() => setShowPassword((prev) => !prev)}
              />

              <Input
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Xác nhận mật khẩu"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={24}
                    color="#8A93A5"
                  />
                }
                rightIcon={
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={24}
                    color="#8A93A5"
                  />
                }
                onPressRightIcon={() => setShowConfirmPassword((prev) => !prev)}
              />

              <Pressable style={styles.registerButton} onPress={handleRegister}>
                <Text style={styles.registerButtonText}>Đăng ký</Text>
                <Ionicons name="arrow-forward" size={28} color="#08110A" />
              </Pressable>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Đã có tài khoản? </Text>
                <Pressable onPress={() => router.back()}>
                  <Text style={styles.loginText}>Đăng nhập</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020817",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 26,
    color: "#8A93A5",
  },
  form: {
    gap: 18,
  },
  registerButton: {
    height: 76,
    borderRadius: 28,
    backgroundColor: "#22C55E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 14,
    marginTop: 10,
  },
  registerButtonText: {
    color: "#08110A",
    fontSize: 22,
    fontWeight: "800",
  },
  footer: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  footerText: {
    color: "#8A93A5",
    fontSize: 16,
  },
  loginText: {
    color: "#22C55E",
    fontSize: 16,
    fontWeight: "700",
  },
});
