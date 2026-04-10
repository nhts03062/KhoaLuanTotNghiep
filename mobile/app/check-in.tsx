import { checkIn } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const getStringParam = (param?: string | string[]) =>
  Array.isArray(param) ? (param[0] ?? "") : (param ?? "");

const getBranchIdFromQr = (rawValue: string) => {
  const value = rawValue.trim();
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as
      | string
      | {
          branchId?: string;
          id?: string;
          branch?: { id?: string };
        };

    if (typeof parsed === "string" && parsed.trim()) {
      return parsed.trim();
    }

    if (typeof parsed === "object" && parsed !== null) {
      return parsed.branchId || parsed.branch?.id || parsed.id || null;
    }
  } catch {}

  try {
    const url = new URL(value);
    return url.searchParams.get("branchId") || null;
  } catch {}

  return value;
};

export default function CheckInScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const queryClient = useQueryClient();
  const [hasScanned, setHasScanned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = useLocalSearchParams<{
    userPackageId?: string | string[];
    branchId?: string | string[];
    packageName?: string | string[];
  }>();

  const userPackageId = getStringParam(params.userPackageId);
  const expectedBranchId = getStringParam(params.branchId);
  const packageName = getStringParam(params.packageName);

  const isMissingParams = useMemo(() => {
    return !userPackageId || !expectedBranchId;
  }, [expectedBranchId, userPackageId]);

  const handleBarcodeScanned = async ({
    data,
  }: BarcodeScanningResult) => {
    if (hasScanned || isSubmitting || isMissingParams) {
      return;
    }

    setHasScanned(true);

    const scannedBranchId = getBranchIdFromQr(data);

    if (!scannedBranchId || scannedBranchId !== expectedBranchId) {
      Toast.show({
        type: "error",
        text1: "QR không hợp lệ",
        text2: "Vui lòng quét mã QR check-in của đúng chi nhánh.",
      });
      setHasScanned(false);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await checkIn({
        userPackageId,
        branchId: expectedBranchId,
      });

      await queryClient.invalidateQueries({
        queryKey: ["my-purchase-packages"],
      });

      Toast.show({
        type: "success",
        text1: "Check-in thành công",
        text2: response?.message || "Bạn đã check-in thành công.",
      });

      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Check-in thất bại",
        text2: error?.response?.data?.message || "Không thể check-in lúc này.",
      });
      setHasScanned(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  if (isMissingParams) {
    return (
      <SafeAreaView style={styles.centeredScreen}>
        <Text style={styles.errorTitle}>Thiếu thông tin check-in</Text>
        <Text style={styles.errorText}>
          Không tìm thấy gói tập hoặc chi nhánh để thực hiện check-in.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centeredScreen}>
        <AntDesign name="camera" size={56} color="#22C55E" />
        <Text style={styles.permissionTitle}>Cần quyền truy cập camera</Text>
        <Text style={styles.permissionText}>
          Hãy cho phép ứng dụng dùng camera để quét mã QR check-in.
        </Text>
        <Pressable onPress={requestPermission} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Cho phép camera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
      />

      <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Quét QR Check-in</Text>
          <Text style={styles.subtitle}>
            {packageName
              ? `Đưa mã QR của chi nhánh vào khung để check-in cho gói ${packageName}.`
              : "Đưa mã QR của chi nhánh vào khung để check-in."}
          </Text>

          <View style={styles.scannerFrame}>
            <View style={styles.scannerCornerTopLeft} />
            <View style={styles.scannerCornerTopRight} />
            <View style={styles.scannerCornerBottomLeft} />
            <View style={styles.scannerCornerBottomRight} />
          </View>
        </View>

        <View style={styles.bottomPanel}>
          {isSubmitting ? (
            <View style={styles.statusRow}>
              <ActivityIndicator color="#22C55E" />
              <Text style={styles.statusText}>Đang xác nhận check-in...</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => setHasScanned(false)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Quét lại</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    backgroundColor: "rgba(2,8,23,0.40)",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(15,23,42,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingBottom: 48,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 32,
  },
  scannerFrame: {
    width: 260,
    height: 260,
    borderRadius: 28,
    backgroundColor: "rgba(15,23,42,0.18)",
    position: "relative",
  },
  scannerCornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 52,
    height: 52,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderColor: "#22C55E",
    borderTopLeftRadius: 28,
  },
  scannerCornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 52,
    height: 52,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderColor: "#22C55E",
    borderTopRightRadius: 28,
  },
  scannerCornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 52,
    height: 52,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderColor: "#22C55E",
    borderBottomLeftRadius: 28,
  },
  scannerCornerBottomRight: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 52,
    height: 52,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderColor: "#22C55E",
    borderBottomRightRadius: 28,
  },
  bottomPanel: {
    paddingBottom: 16,
  },
  statusRow: {
    height: 56,
    borderRadius: 20,
    backgroundColor: "rgba(15,23,42,0.8)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 10,
  },
  statusText: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    height: 56,
    borderRadius: 20,
    backgroundColor: "rgba(15,23,42,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
  },
  centeredScreen: {
    flex: 1,
    backgroundColor: "#020817",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  permissionTitle: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    color: "#94A3B8",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 28,
  },
  primaryButton: {
    minWidth: 200,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: "#08110A",
    fontSize: 16,
    fontWeight: "800",
  },
  errorTitle: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    color: "#94A3B8",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 28,
  },
});
