import { Feather, Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import Input from "@/components/input/input";
import { signin } from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  const loginMutation = useMutation({
    mutationFn: () => signin(email, password),
    onSuccess: async (data) => {
      await setAccessToken(data.access_token);

      Toast.show({
        type: "success",
        text1: "Đăng nhập thành công",
      });

      router.replace("/(tabs)");
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Đăng nhập thất bại",
        text2:
          error?.response?.data?.message ||
          error?.message ||
          "Email hoặc mật khẩu không đúng",
      });
    },
  });

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập email và mật khẩu",
      });
      return;
    }

    loginMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Chào mừng trở lại 💪</Text>
            <Text style={styles.subtitle}>
              Đăng nhập để tiếp tục hành trình fitness của bạn
            </Text>
          </View>

          <View style={styles.form}>
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

            <Pressable style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </Pressable>

            <Pressable
              style={[
                styles.loginButton,
                loginMutation.isPending && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loginMutation.isPending}
            >
              <Text style={styles.loginButtonText}>
                {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </Text>
              {!loginMutation.isPending && (
                <Ionicons name="arrow-forward" size={28} color="#08110A" />
              )}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Chưa có tài khoản? </Text>
              <Pressable onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.registerText}>Đăng ký ngay</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 48,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 18,
  },
  forgotPasswordText: {
    color: "#22C55E",
    fontSize: 16,
    fontWeight: "600",
  },
  loginButton: {
    height: 76,
    borderRadius: 28,
    backgroundColor: "#22C55E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 14,
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
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
  registerText: {
    color: "#22C55E",
    fontSize: 16,
    fontWeight: "700",
  },
});
