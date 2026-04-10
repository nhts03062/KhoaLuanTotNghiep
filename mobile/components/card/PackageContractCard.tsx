import { MyPurchasePackage } from "@/types/types";
import { APP_ROUTES } from "@/constants/appRoute";
import { Feather, Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  item: MyPurchasePackage;
  onRequestPt?: (item: MyPurchasePackage) => void;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "--/--/----";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "--/--/----";

  return date.toLocaleDateString("vi-VN");
};

const getStatusLabel = (status: MyPurchasePackage["status"]) => {
  switch (status) {
    case "ACTIVE":
      return "ĐÃ KÍCH HOẠT";
    case "PENDING":
      return "CHỜ XỬ LÝ";
    case "EXPIRED":
      return "HẾT HẠN";
    case "CANCELLED":
      return "ĐÃ HỦY";
    case "REJECTED":
      return "BỊ TỪ CHỐI";
    default:
      return status;
  }
};

export default function PackageContractCard({ item, onRequestPt }: Props) {
  const ptName = useMemo(() => {
    if (!item.package.hasPt) {
      return "Không có PT";
    }
    return item.ptAccount?.profile?.name || item.ptAccount?.email || "Chọn theo từng buổi";
  }, [item.package.hasPt, item.ptAccount]);

  const branchAddress =
    item.branch?.address || item.branch?.name || "Chưa có địa chỉ";
  const canRequestPt = item.package.hasPt && item.status === "ACTIVE";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="award" size={24} color="#19F07C" />
          <Text style={styles.headerTitle}>Gói tập</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.packageName}>
            {item.package.name.toUpperCase()}
          </Text>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={24} color="#19F07C" />
            <Text style={styles.infoLabel}>Chi nhánh</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {branchAddress}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={24} color="#19F07C" />
            <Text style={styles.infoLabel}>PT</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {item.package.hasPt ? ptName : "Không có PT"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={24} color="#19F07C" />
            <Text style={styles.infoLabel}>Ngày hết hạn</Text>
            <Text style={[styles.infoValue, styles.endDate]}>
              {formatDate(item.endAt)}
            </Text>
          </View>
        </View>

        {item.package.hasPt && (
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={!canRequestPt || !onRequestPt}
            style={[
              styles.requestPtButton,
              (!canRequestPt || !onRequestPt) && styles.requestPtButtonDisabled,
            ]}
            onPress={() => onRequestPt?.(item)}
          >
            <Ionicons
              name="fitness-outline"
              size={20}
              color={canRequestPt ? "#08110A" : "#94A3B8"}
            />
            <Text
              style={[
                styles.requestPtButtonText,
                !canRequestPt && styles.requestPtButtonTextDisabled,
              ]}
            >
              {canRequestPt ? "Đặt lịch với PT" : "Chưa thể đặt lịch PT"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.scanButton}
        onPress={() =>
          router.push({
            pathname: APP_ROUTES.CHECK_IN,
            params: {
              userPackageId: item.id,
              branchId: item.branchId,
              packageName: item.package.name,
            },
          })
        }
      >
        <AntDesign name="qrcode" size={26} color="#F8FAFC" />
        <Text style={styles.scanButtonText}>Quét QR Check-in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 360,
    borderRadius: 28,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginRight: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 0,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 24,
  },
  packageName: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
  },
  statusBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  statusText: {
    color: "#08110A",
    fontSize: 14,
    fontWeight: "800",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
  },
  infoLabel: {
    color: "#7C8698",
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
  },
  infoValue: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  endDate: {
    color: "#19F07C",
    fontSize: 17,
  },
  requestPtButton: {
    marginTop: 22,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#22C55E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 10,
  },
  requestPtButtonDisabled: {
    backgroundColor: "#182235",
  },
  requestPtButtonText: {
    color: "#08110A",
    fontSize: 15,
    fontWeight: "800",
  },
  requestPtButtonTextDisabled: {
    color: "#94A3B8",
  },
  scanButton: {
    marginTop: 20,
    backgroundColor: "#22C55E",
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  scanButtonText: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
  },
});
