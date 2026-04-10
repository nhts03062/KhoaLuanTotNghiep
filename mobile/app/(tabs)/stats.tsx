import { getListWorkoutHistory, getPTAssistSchedule } from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";
import { PTAssistSchedule, WorkoutHistory } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StatusFilter = "ALL" | "COMPLETED" | "SKIPPED";
type PtStatusFilter = "ALL" | "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

const statusOptions: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "SKIPPED", label: "Vắng mặt" },
];

const ptStatusOptions: { key: PtStatusFilter; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "ACCEPTED", label: "Đã xác nhận" },
  { key: "PENDING", label: "Chờ xác nhận" },
  { key: "REJECTED", label: "Từ chối" },
  { key: "CANCELLED", label: "Đã hủy" },
];

const statusLabel = (status: WorkoutHistory["status"]) => {
  if (status === "COMPLETED") return "Hoàn thành";
  if (status === "SKIPPED") return "Vắng mặt";
  return status;
};

const statusStyle = (status: WorkoutHistory["status"]) => {
  if (status === "COMPLETED") {
    return {
      backgroundColor: "rgba(34,197,94,0.12)",
      color: "#22C55E",
    };
  }

  return {
    backgroundColor: "rgba(245,158,11,0.12)",
    color: "#F59E0B",
  };
};

const ptStatusLabel = (status: PTAssistSchedule["extendedProps"]["status"]) => {
  if (status === "ACCEPTED") return "Đã xác nhận";
  if (status === "PENDING") return "Chờ xác nhận";
  if (status === "REJECTED") return "Đã từ chối";
  if (status === "CANCELLED") return "Đã hủy";
  return status;
};

const ptStatusStyle = (status: PTAssistSchedule["extendedProps"]["status"]) => {
  if (status === "ACCEPTED") {
    return {
      backgroundColor: "rgba(34,197,94,0.12)",
      color: "#22C55E",
    };
  }
  if (status === "PENDING") {
    return {
      backgroundColor: "rgba(245,158,11,0.12)",
      color: "#F59E0B",
    };
  }
  return {
    backgroundColor: "rgba(239,68,68,0.12)",
    color: "#EF4444",
  };
};

const getDayLabel = (dayOfWeek: number) => {
  const map: Record<number, string> = {
    1: "Thứ 2",
    2: "Thứ 3",
    3: "Thứ 4",
    4: "Thứ 5",
    5: "Thứ 6",
    6: "Thứ 7",
    7: "Chủ nhật",
  };

  return map[dayOfWeek] || `Ngày ${dayOfWeek}`;
};

const formatWorkoutDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatWorkoutTime = (value: string) =>
  new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const getHistoryRange = () => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(start.getDate() - 90);
  start.setHours(0, 0, 0, 0);

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
};

const formatSessionTimeRange = (start: string, end: string) =>
  `${formatWorkoutDate(start)} • ${formatWorkoutTime(start)} - ${formatWorkoutTime(end)}`;

const getTraineeName = (item: PTAssistSchedule) =>
  item.extendedProps.account.profile?.name || item.extendedProps.account.email;

export default function StatsScreen() {
  const user = useAuthStore((state) => state.user);
  const isPt = user?.role === "PT";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [ptStatusFilter, setPtStatusFilter] = useState<PtStatusFilter>("ALL");

  const { data, isLoading, isError, refetch: refetchWorkoutHistory } = useQuery({
    queryKey: ["workout-history"],
    queryFn: () => getListWorkoutHistory(),
    enabled: !isPt,
  });
  const {
    data: ptAssistData,
    isLoading: isLoadingPtHistory,
    isError: isPtHistoryError,
    refetch: refetchPtTeachingHistory,
  } = useQuery({
    queryKey: ["pt-teaching-history"],
    queryFn: () => getPTAssistSchedule(getHistoryRange()),
    enabled: isPt,
  });

  const handleRefreshStats = useCallback(async () => {
    if (isPt) {
      await refetchPtTeachingHistory();
    } else {
      await refetchWorkoutHistory();
    }
  }, [isPt, refetchPtTeachingHistory, refetchWorkoutHistory]);

  const { refreshControl } = usePullToRefresh(handleRefreshStats);

  const histories = useMemo<WorkoutHistory[]>(() => {
    const list = data?.data ?? [];
    if (statusFilter === "ALL") return list;
    return list.filter((item) => item.status === statusFilter);
  }, [data, statusFilter]);

  const summary = useMemo(() => {
    const list = data?.data ?? [];
    return {
      total: list.length,
      completed: list.filter((item) => item.status === "COMPLETED").length,
      skipped: list.filter((item) => item.status === "SKIPPED").length,
    };
  }, [data]);

  const ptHistories = useMemo<PTAssistSchedule[]>(() => {
    const now = Date.now();
    const list = (ptAssistData?.data ?? [])
      .filter((item: PTAssistSchedule) => new Date(item.start).getTime() <= now)
      .sort((a: PTAssistSchedule, b: PTAssistSchedule) => {
        return new Date(b.start).getTime() - new Date(a.start).getTime();
      });

    if (ptStatusFilter === "ALL") return list;
    return list.filter((item) => item.extendedProps.status === ptStatusFilter);
  }, [ptAssistData, ptStatusFilter]);

  const ptSummary = useMemo(() => {
    const now = Date.now();
    const list = (ptAssistData?.data ?? []).filter(
      (item: PTAssistSchedule) => new Date(item.start).getTime() <= now,
    );

    return {
      total: list.length,
      accepted: list.filter((item) => item.extendedProps.status === "ACCEPTED").length,
      pending: list.filter((item) => item.extendedProps.status === "PENDING").length,
    };
  }, [ptAssistData]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {isPt ? "Lịch sử dạy trainee" : "Lịch sử tập luyện"}
          </Text>
          <Text style={styles.subtitle}>
            {isPt
              ? "Theo dõi các buổi dạy trainee đã diễn ra và trạng thái hỗ trợ."
              : "Theo dõi các buổi tập bạn đã hoàn thành hoặc bỏ lỡ."}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{isPt ? ptSummary.total : summary.total}</Text>
            <Text style={styles.summaryLabel}>Tổng buổi</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, styles.completedValue]}>
              {isPt ? ptSummary.accepted : summary.completed}
            </Text>
            <Text style={styles.summaryLabel}>
              {isPt ? "Đã xác nhận" : "Hoàn thành"}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, styles.skippedValue]}>
              {isPt ? ptSummary.pending : summary.skipped}
            </Text>
            <Text style={styles.summaryLabel}>
              {isPt ? "Chờ xác nhận" : "Vắng mặt"}
            </Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {(isPt ? ptStatusOptions : statusOptions).map((option) => {
            const isActive = isPt
              ? option.key === ptStatusFilter
              : option.key === statusFilter;

            return (
              <Pressable
                key={option.key}
                onPress={() =>
                  isPt
                    ? setPtStatusFilter(option.key as PtStatusFilter)
                    : setStatusFilter(option.key as StatusFilter)
                }
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isPt ? (
          isLoadingPtHistory ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
              <Text style={styles.stateText}>Đang tải lịch sử dạy trainee...</Text>
            </View>
          ) : isPtHistoryError ? (
            <View style={styles.stateContainer}>
              <Text style={styles.errorTitle}>Không tải được lịch sử dạy trainee</Text>
              <Text style={styles.stateText}>
                Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.
              </Text>
            </View>
          ) : ptHistories.length ? (
            ptHistories.map((item) => {
              const statusMeta = ptStatusStyle(item.extendedProps.status);

              return (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyHeaderLeft}>
                      <View style={styles.iconBox}>
                        <Ionicons name="people-outline" size={22} color="#22C55E" />
                      </View>
                      <View style={styles.historyTitleWrap}>
                        <Text style={styles.historyTitle}>{getTraineeName(item)}</Text>
                        <View style={styles.inlineMetaRow}>
                          <Text style={styles.inlineMetaText}>
                            {formatSessionTimeRange(item.start, item.end)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusMeta.backgroundColor },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusMeta.color }]}>
                        {ptStatusLabel(item.extendedProps.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metricsRow}>
                    <View style={styles.metricCard}>
                      <MaterialCommunityIcons
                        name="dumbbell"
                        size={18}
                        color="#22C55E"
                      />
                      <View style={styles.metricContent}>
                        <Text style={styles.metricLabel}>Gói tập</Text>
                        <Text style={styles.metricValue}>
                          {item.extendedProps.userPackage.package.name}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.metricCard}>
                      <Ionicons name="location-outline" size={18} color="#F59E0B" />
                      <View style={styles.metricContent}>
                        <Text style={styles.metricLabel}>Chi nhánh</Text>
                        <Text style={styles.metricValue}>
                          {item.extendedProps.branch.name}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.noteCard}>
                    <Text style={styles.noteLabel}>Ghi chú</Text>
                    <Text style={styles.noteText}>
                      {item.extendedProps.note?.trim() ||
                        item.extendedProps.rejectReason?.trim() ||
                        "Chưa cập nhật"}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
              <Text style={styles.emptyText}>
                Bạn chưa có lịch sử dạy trainee nào để hiển thị.
              </Text>
            </View>
          )
        ) : isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.stateText}>Đang tải lịch sử tập luyện...</Text>
          </View>
        ) : isError ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorTitle}>Không tải được lịch sử tập luyện</Text>
            <Text style={styles.stateText}>
              Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.
            </Text>
          </View>
        ) : histories.length ? (
          histories.map((item) => {
            const statusMeta = statusStyle(item.status);

            return (
              <Pressable
                key={item.id}
                style={styles.historyCard}
                onPress={() =>
                  router.push({
                    pathname: "/program/[id]",
                    params: { id: item.program.id },
                  })
                }
              >
                <View style={styles.historyHeader}>
                  <View style={styles.historyHeaderLeft}>
                    <View style={styles.iconBox}>
                      <Ionicons name="calendar-outline" size={22} color="#22C55E" />
                    </View>
                    <View style={styles.historyTitleWrap}>
                      <Text style={styles.historyTitle}>
                        {item.programDay.title || item.program.name}
                      </Text>
                      <View style={styles.inlineMetaRow}>
                        <Text style={styles.inlineMetaText}>
                          {formatWorkoutDate(item.workoutAt)}
                        </Text>
                        <Text style={styles.inlineMetaDot}>•</Text>
                        <Text style={styles.inlineMetaText}>
                          {formatWorkoutTime(item.workoutAt)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusMeta.backgroundColor },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: statusMeta.color }]}>
                      {statusLabel(item.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricCard}>
                    <MaterialCommunityIcons
                      name="dumbbell"
                      size={18}
                      color="#22C55E"
                    />
                    <View style={styles.metricContent}>
                      <Text style={styles.metricLabel}>Chương trình</Text>
                      <Text style={styles.metricValue}>{item.program.name}</Text>
                    </View>
                  </View>

                  <View style={styles.metricCard}>
                    <Ionicons name="flame-outline" size={18} color="#F59E0B" />
                    <View style={styles.metricContent}>
                      <Text style={styles.metricLabel}>Buổi trong tuần</Text>
                      <Text style={styles.metricValue}>
                        {getDayLabel(item.programDay.dayOfWeek)} -{" "}
                        {item.programDay.title}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.noteCard}>
                  <Text style={styles.noteLabel}>Ghi chú</Text>
                  <Text style={styles.noteText}>
                    {item.note?.trim() || "Chưa cập nhật"}
                  </Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
            <Text style={styles.emptyText}>
              Bạn chưa có lịch sử tập luyện nào để hiển thị.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020817",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#101826",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 18,
    alignItems: "center",
  },
  summaryValue: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
  },
  completedValue: {
    color: "#22C55E",
  },
  skippedValue: {
    color: "#F59E0B",
  },
  summaryLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  filterChip: {
    minWidth: 92,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  filterChipText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "800",
  },
  filterChipTextActive: {
    color: "#08110A",
  },
  historyCard: {
    borderRadius: 24,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    marginBottom: 14,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  historyHeaderLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(34,197,94,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  historyTitleWrap: {
    flex: 1,
  },
  historyTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  inlineMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  inlineMetaText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  inlineMetaDot: {
    color: "#475569",
    fontSize: 13,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  metricsRow: {
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    backgroundColor: "#182235",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
  },
  noteCard: {
    borderRadius: 18,
    backgroundColor: "#182235",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noteLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 4,
  },
  noteText: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  errorTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  stateText: {
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 12,
  },
  emptyState: {
    borderRadius: 24,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 24,
    marginTop: 8,
  },
  emptyTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
