import {
  getCheckInHistory,
  getPTAssistSchedule,
  getPTTrainingHistory,
  reportUserSession,
} from "@/services/api";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useAuthStore } from "@/stores/auth.store";
import {
  CheckInHistoryItem,
  PTAssistSchedule,
  PTTrainingHistory,
  ReportUserSessionRequest,
} from "@/types/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  InteractionManager,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type MarkedDate = {
  color?: string;
  textColor?: string;
  startingDay?: boolean;
  endingDay?: boolean;
  selected?: boolean;
  selectedColor?: string;
  marked?: boolean;
  dotColor?: string;
};

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const today = new Date().toISOString().split("T")[0];

type ScheduleTab = "checkin" | "pt";
type SessionStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
type CompletionStatus = "COMPLETED" | "INCOMPLETE";

const formatCheckInTime = (value: string) =>
  new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDisplayDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatSessionTime = (startTime: string, endTime: string) => {
  const start = new Date(startTime).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const end = new Date(endTime).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${start} - ${end}`;
};

const getSessionStatusLabel = (status: SessionStatus) => {
  switch (status) {
    case "ACCEPTED":
      return "Đã xác nhận";
    case "PENDING":
      return "Chờ xác nhận";
    case "REJECTED":
      return "Đã từ chối";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
};

const getSessionStatusColor = (status: SessionStatus) => {
  switch (status) {
    case "ACCEPTED":
      return "#22C55E";
    case "PENDING":
      return "#F59E0B";
    case "REJECTED":
      return "#EF4444";
    case "CANCELLED":
      return "#64748B";
    default:
      return "#22C55E";
  }
};

const isNextDay = (current: string, next: string) => {
  const currentDate = new Date(`${current}T00:00:00`);
  const nextDate = new Date(`${next}T00:00:00`);

  return nextDate.getTime() - currentDate.getTime() === ONE_DAY_IN_MS;
};

const buildMarkedDates = (dates: string[]) => {
  return dates.reduce<Record<string, MarkedDate>>((acc, date, index) => {
    const previousDate = dates[index - 1];
    const nextDate = dates[index + 1];
    const hasPrevious = Boolean(previousDate && isNextDay(previousDate, date));
    const hasNext = Boolean(nextDate && isNextDay(date, nextDate));

    acc[date] = {
      color: "#22C55E",
      textColor: "#08110A",
      startingDay: !hasPrevious,
      endingDay: !hasNext,
    };

    return acc;
  }, {});
};

const getMonthRange = (dateString: string) => {
  const [year, month] = dateString.split("-").map(Number);
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
};

const getTraineeName = (item: PTAssistSchedule) =>
  item.extendedProps.account.profile?.name || item.extendedProps.account.email;

export default function ScheduleScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isPt = user?.role === "PT";
  const [activeTab, setActiveTab] = useState<ScheduleTab>("checkin");
  const [selectedCheckInDate, setSelectedCheckInDate] = useState(today);
  const [selectedPtDate, setSelectedPtDate] = useState(today);
  const [ptCalendarMonth, setPtCalendarMonth] = useState(today);
  const [selectedAssistSchedule, setSelectedAssistSchedule] = useState<PTAssistSchedule | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState<ReportUserSessionRequest>({
    ptAssistRequestId: "",
    completion: "COMPLETED",
    summary: "",
    techniqueNote: "",
    improvement: "",
    nextSessionPlan: "",
    weightKg: 0,
    bodyNote: "",
  });

  const { data, isLoading, isError, refetch: refetchCheckInHistory } = useQuery({
    queryKey: ["check-in-history"],
    queryFn: getCheckInHistory,
  });
  const {
    data: ptHistoryData,
    isLoading: isLoadingPtHistory,
    isError: isPtHistoryError,
    refetch: refetchPtTrainingHistory,
  } = useQuery({
    queryKey: ["pt-training-history"],
    queryFn: () => getPTTrainingHistory(),
    enabled: !isPt,
  });
  const {
    data: ptAssistData,
    isLoading: isLoadingPtAssist,
    isError: isPtAssistError,
    refetch: refetchPtAssistSchedule,
  } = useQuery({
    queryKey: ["pt-assist-schedule", ptCalendarMonth],
    queryFn: () => getPTAssistSchedule(getMonthRange(ptCalendarMonth)),
    enabled: isPt,
  });

  const handleRefreshSchedule = useCallback(async () => {
    const tasks: Promise<unknown>[] = [refetchCheckInHistory()];
    if (isPt) {
      tasks.push(refetchPtAssistSchedule());
    } else {
      tasks.push(refetchPtTrainingHistory());
    }
    await Promise.all(tasks);
  }, [isPt, refetchCheckInHistory, refetchPtAssistSchedule, refetchPtTrainingHistory]);

  const { refreshControl } = usePullToRefresh(handleRefreshSchedule);

  const groupedHistory = useMemo(
    () => data?.data ?? {},
    [data],
  );

  const checkInDates = useMemo(
    () => Object.keys(groupedHistory).sort(),
    [groupedHistory],
  );

  const markedDates = useMemo(
    () => buildMarkedDates(checkInDates),
    [checkInDates],
  );

  const selectedItems = useMemo<CheckInHistoryItem[]>(
    () => groupedHistory[selectedCheckInDate] ?? [],
    [groupedHistory, selectedCheckInDate],
  );

  const ptTrainingHistory = useMemo(
    () => ptHistoryData?.data ?? [],
    [ptHistoryData],
  );

  const groupedPtHistory = useMemo(() => {
    return ptTrainingHistory.reduce<Record<string, PTTrainingHistory[]>>(
      (acc, item) => {
        const key = item.startTime.split("T")[0];
        acc[key] = [...(acc[key] ?? []), item].sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );
        return acc;
      },
      {},
    );
  }, [ptTrainingHistory]);

  const ptAssistSchedules = useMemo(
    () => ptAssistData?.data ?? [],
    [ptAssistData],
  );

  const groupedPtAssistSchedules = useMemo(() => {
    return ptAssistSchedules.reduce<Record<string, PTAssistSchedule[]>>((acc, item) => {
      const key = item.start.split("T")[0];
      acc[key] = [...(acc[key] ?? []), item].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      );
      return acc;
    }, {});
  }, [ptAssistSchedules]);

  const displayedPtGroupedHistory = isPt
    ? groupedPtAssistSchedules
    : groupedPtHistory;

  const ptDates = useMemo(
    () => Object.keys(displayedPtGroupedHistory).sort(),
    [displayedPtGroupedHistory],
  );

  const ptMarkedDates = useMemo(() => {
    return ptDates.reduce<Record<string, MarkedDate>>((acc, date) => {
      const hasAcceptedSession = isPt
        ? (groupedPtAssistSchedules[date] ?? []).some(
            (item) => item.extendedProps.status === "ACCEPTED",
          )
        : (groupedPtHistory[date] ?? []).some((item) => item.status === "ACCEPTED");
      const hasRejectedSession = isPt
        ? (groupedPtAssistSchedules[date] ?? []).some(
            (item) => item.extendedProps.status === "REJECTED",
          )
        : (groupedPtHistory[date] ?? []).some((item) => item.status === "REJECTED");

      acc[date] = {
        marked: true,
        dotColor: hasRejectedSession
          ? "#EF4444"
          : hasAcceptedSession
            ? "#22C55E"
            : "#F59E0B",
        selected: date === selectedPtDate,
        selectedColor: "#22C55E",
      };

      return acc;
    }, {});
  }, [
    groupedPtAssistSchedules,
    groupedPtHistory,
    isPt,
    ptDates,
    selectedPtDate,
  ]);

  const selectedPtItems = useMemo<PTTrainingHistory[]>(
    () => groupedPtHistory[selectedPtDate] ?? [],
    [groupedPtHistory, selectedPtDate],
  );
  const selectedPtAssistItems = useMemo<PTAssistSchedule[]>(
    () => groupedPtAssistSchedules[selectedPtDate] ?? [],
    [groupedPtAssistSchedules, selectedPtDate],
  );

  const reportSessionMutation = useMutation({
    mutationFn: reportUserSession,
    onSuccess: (response) => {
      Toast.show({
        type: "success",
        text1: "Đã gửi nhận xét buổi tập",
        text2: response.message,
      });
      queryClient.invalidateQueries({ queryKey: ["pt-assist-schedule"] });
      setFeedbackOpen(false);
      setDetailOpen(false);
      setSelectedAssistSchedule(null);
      setFeedbackForm({
        ptAssistRequestId: "",
        completion: "COMPLETED",
        summary: "",
        techniqueNote: "",
        improvement: "",
        nextSessionPlan: "",
        weightKg: 0,
        bodyNote: "",
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Không thể gửi nhận xét",
        text2: error?.response?.data?.message || "Vui lòng thử lại sau.",
      });
    },
  });

  useEffect(() => {
    if (!checkInDates.length) {
      setSelectedCheckInDate(today);
      return;
    }

    setSelectedCheckInDate((current) =>
      groupedHistory[current] ? current : checkInDates[checkInDates.length - 1],
    );
  }, [checkInDates, groupedHistory]);

  useEffect(() => {
    if (!ptDates.length) {
      setSelectedPtDate(today);
      return;
    }

    setSelectedPtDate((current) =>
      displayedPtGroupedHistory[current] ? current : ptDates[ptDates.length - 1],
    );
  }, [displayedPtGroupedHistory, ptDates]);

  const ptTabTitle = isPt ? "Lịch hẹn trainee" : "Lịch với PT";
  const ptSubtitle = isPt
    ? "Theo dõi lịch check-in và lịch hẹn tập với trainee."
    : "Theo dõi lịch check-in và lịch tập với PT.";
  const isLoadingPtSection = isPt ? isLoadingPtAssist : isLoadingPtHistory;
  const isPtSectionError = isPt ? isPtAssistError : isPtHistoryError;

  const openAssistDetail = (item: PTAssistSchedule) => {
    setSelectedAssistSchedule(item);
    setDetailOpen(true);
  };

  const openFeedbackModal = () => {
    if (!selectedAssistSchedule) {
      return;
    }

    setFeedbackForm({
      ptAssistRequestId: selectedAssistSchedule.id,
      completion: "COMPLETED",
      summary: "",
      techniqueNote: "",
      improvement: "",
      nextSessionPlan: "",
      weightKg: 0,
      bodyNote: "",
    });
    setDetailOpen(false);
    InteractionManager.runAfterInteractions(() => {
      setFeedbackOpen(true);
    });
  };

  const closeDetailModal = (clearSelection = true) => {
    setDetailOpen(false);
    if (clearSelection) {
      setSelectedAssistSchedule(null);
    }
  };

  const handleSubmitFeedback = () => {
    if (
      !feedbackForm.summary.trim() ||
      !feedbackForm.techniqueNote.trim() ||
      !feedbackForm.improvement.trim() ||
      !feedbackForm.nextSessionPlan.trim() ||
      !feedbackForm.bodyNote.trim()
    ) {
      Toast.show({
        type: "error",
        text1: "Vui lòng nhập đầy đủ thông tin nhận xét",
      });
      return;
    }

    if (!feedbackForm.weightKg || Number.isNaN(Number(feedbackForm.weightKg))) {
      Toast.show({
        type: "error",
        text1: "Cân nặng không hợp lệ",
      });
      return;
    }

    reportSessionMutation.mutate({
      ...feedbackForm,
      weightKg: Number(feedbackForm.weightKg),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Lịch tập</Text>
          <Text style={styles.subtitle}>{ptSubtitle}</Text>
        </View>

        <View style={styles.tabsContainer}>
          <Pressable
            onPress={() => setActiveTab("checkin")}
            style={[
              styles.tabButton,
              activeTab === "checkin" && styles.tabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "checkin" && styles.tabTextActive,
              ]}
            >
              Lịch check-in
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("pt")}
            style={[styles.tabButton, activeTab === "pt" && styles.tabButtonActive]}
          >
            <Text
              style={[styles.tabText, activeTab === "pt" && styles.tabTextActive]}
            >
              {ptTabTitle}
            </Text>
          </Pressable>
        </View>

        {activeTab === "checkin" ? (
          <>
            <View style={styles.calendarCard}>
              {isLoading ? (
                <View style={styles.stateBox}>
                  <ActivityIndicator size="large" color="#22C55E" />
                  <Text style={styles.stateText}>Đang tải lịch check-in...</Text>
                </View>
              ) : isError ? (
                <View style={styles.stateBox}>
                  <Text style={styles.stateTitle}>Không tải được lịch check-in</Text>
                  <Text style={styles.stateText}>
                    Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.
                  </Text>
                </View>
              ) : (
                <Calendar
                  current={selectedCheckInDate}
                  markingType="period"
                  markedDates={markedDates}
                  onDayPress={(day) => setSelectedCheckInDate(day.dateString)}
                  hideExtraDays
                  theme={{
                    calendarBackground: "#101826",
                    monthTextColor: "#F8FAFC",
                    dayTextColor: "#F8FAFC",
                    textDisabledColor: "#475569",
                    todayTextColor: "#22C55E",
                    arrowColor: "#22C55E",
                    selectedDayBackgroundColor: "#22C55E",
                    textSectionTitleColor: "#94A3B8",
                    textMonthFontWeight: "800",
                    textDayFontWeight: "700",
                    textDayHeaderFontWeight: "700",
                  }}
                  style={styles.calendar}
                />
              )}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                {formatDisplayDate(selectedCheckInDate)}
              </Text>
              <Text style={styles.summarySubtitle}>
                {selectedItems.length
                  ? `Bạn đã check-in ${selectedItems.length} lần trong ngày này.`
                  : "Bạn chưa có check-in nào trong ngày này."}
              </Text>

              {selectedItems.length ? (
                selectedItems.map((item) => (
                  <View key={item.id} style={styles.checkInItem}>
                    <View>
                      <Text style={styles.checkInBranch}>{item.branch.name}</Text>
                      <Text style={styles.checkInMeta}>
                        Mã gói: {item.userPackageId.slice(0, 8)}
                      </Text>
                    </View>

                    <View style={styles.timeBadge}>
                      <Text style={styles.timeText}>
                        {formatCheckInTime(item.checkedInAt)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Chưa có buổi tập nào được ghi nhận.
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            <View style={styles.calendarCard}>
              {isLoadingPtSection ? (
                <View style={styles.stateBox}>
                  <ActivityIndicator size="large" color="#22C55E" />
                  <Text style={styles.stateText}>
                    {isPt
                      ? "Đang tải lịch hẹn với trainee..."
                      : "Đang tải lịch tập với PT..."}
                  </Text>
                </View>
              ) : isPtSectionError ? (
                <View style={styles.stateBox}>
                  <Text style={styles.stateTitle}>
                    {isPt
                      ? "Không tải được lịch hẹn với trainee"
                      : "Không tải được lịch với PT"}
                  </Text>
                  <Text style={styles.stateText}>
                    Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.
                  </Text>
                </View>
              ) : (
                <Calendar
                  current={selectedPtDate}
                  markedDates={ptMarkedDates}
                  onDayPress={(day) => setSelectedPtDate(day.dateString)}
                  onMonthChange={(month) =>
                    setPtCalendarMonth(
                      `${month.year}-${String(month.month).padStart(2, "0")}-01`,
                    )
                  }
                  hideExtraDays
                  theme={{
                    calendarBackground: "#101826",
                    monthTextColor: "#F8FAFC",
                    dayTextColor: "#F8FAFC",
                    textDisabledColor: "#475569",
                    todayTextColor: "#22C55E",
                    arrowColor: "#22C55E",
                    selectedDayBackgroundColor: "#22C55E",
                    selectedDayTextColor: "#08110A",
                    dotColor: "#22C55E",
                    textSectionTitleColor: "#94A3B8",
                    textMonthFontWeight: "800",
                    textDayFontWeight: "700",
                    textDayHeaderFontWeight: "700",
                  }}
                  style={styles.calendar}
                />
              )}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{formatDisplayDate(selectedPtDate)}</Text>
              <Text style={styles.summarySubtitle}>
                {isPt
                  ? selectedPtAssistItems.length
                    ? `Bạn có ${selectedPtAssistItems.length} lịch hẹn với trainee trong ngày này.`
                    : "Bạn chưa có lịch hẹn với trainee trong ngày này."
                  : selectedPtItems.length
                    ? `Bạn có ${selectedPtItems.length} lịch tập với PT trong ngày này.`
                    : "Bạn chưa có lịch tập với PT trong ngày này."}
              </Text>

              {(isPt ? selectedPtAssistItems.length : selectedPtItems.length) ? (
                isPt ? (
                  selectedPtAssistItems.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.ptSessionCard}
                      onPress={() => openAssistDetail(item)}
                    >
                      <View style={styles.ptSessionHeader}>
                        <View style={styles.ptSessionHeaderContent}>
                          <Text style={styles.ptSessionTitle}>
                            {item.extendedProps.userPackage.package.name}
                          </Text>
                          <Text style={styles.ptSessionMeta}>
                            Trainee: {getTraineeName(item)}
                          </Text>
                          <Text style={styles.ptSessionMeta}>
                            Email: {item.extendedProps.account.email}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.ptStatusBadge,
                            {
                              backgroundColor: `${getSessionStatusColor(
                                item.extendedProps.status,
                              )}22`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.ptStatusText,
                              { color: getSessionStatusColor(item.extendedProps.status) },
                            ]}
                          >
                            {getSessionStatusLabel(item.extendedProps.status)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.ptDetailRow}>
                        <Ionicons name="time-outline" size={18} color="#22C55E" />
                        <Text style={styles.ptDetailText}>
                          {formatSessionTime(item.start, item.end)}
                        </Text>
                      </View>

                      <View style={styles.ptDetailRow}>
                        <Ionicons name="location-outline" size={18} color="#22C55E" />
                        <Text style={styles.ptDetailText}>
                          {item.extendedProps.branch.name}
                        </Text>
                      </View>

                      {item.extendedProps.note ? (
                        <View style={styles.ptNoteBox}>
                          <Text style={styles.ptNoteLabel}>Ghi chú</Text>
                          <Text style={styles.ptNoteText}>{item.extendedProps.note}</Text>
                        </View>
                      ) : null}

                      {item.extendedProps.rejectReason ? (
                        <View style={styles.ptNoteBox}>
                          <Text style={styles.ptRejectLabel}>Lý do từ chối</Text>
                          <Text style={styles.ptNoteText}>
                            {item.extendedProps.rejectReason}
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles.detailActionRow}>
                        <Text style={styles.detailActionText}>Chạm để xem chi tiết</Text>
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                      </View>
                    </Pressable>
                  ))
                ) : (
                  selectedPtItems.map((item) => (
                    <View key={item.id} style={styles.ptSessionCard}>
                      <View style={styles.ptSessionHeader}>
                        <View style={styles.ptSessionHeaderContent}>
                          <Text style={styles.ptSessionTitle}>
                            {item.userPackage.package.name}
                          </Text>
                          <Text style={styles.ptSessionMeta}>
                            PT: {item.ptAccount.profile?.name || item.ptAccount.email}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.ptStatusBadge,
                            { backgroundColor: `${getSessionStatusColor(item.status)}22` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.ptStatusText,
                              { color: getSessionStatusColor(item.status) },
                            ]}
                          >
                            {getSessionStatusLabel(item.status)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.ptDetailRow}>
                        <Ionicons name="time-outline" size={18} color="#22C55E" />
                        <Text style={styles.ptDetailText}>
                          {formatSessionTime(item.startTime, item.endTime)}
                        </Text>
                      </View>

                      <View style={styles.ptDetailRow}>
                        <Ionicons name="location-outline" size={18} color="#22C55E" />
                        <Text style={styles.ptDetailText}>{item.branch.name}</Text>
                      </View>

                      {item.note ? (
                        <View style={styles.ptNoteBox}>
                          <Text style={styles.ptNoteLabel}>Ghi chú</Text>
                          <Text style={styles.ptNoteText}>{item.note}</Text>
                        </View>
                      ) : null}

                      {item.rejectReason ? (
                        <View style={styles.ptNoteBox}>
                          <Text style={styles.ptRejectLabel}>Lý do từ chối</Text>
                          <Text style={styles.ptNoteText}>{item.rejectReason}</Text>
                        </View>
                      ) : null}

                      {item.sessionReport ? (
                        <View style={styles.ptReportBox}>
                          <Text style={styles.ptReportTitle}>Nhận xét buổi tập</Text>
                          <Text style={styles.ptReportText}>
                            {item.sessionReport.summary || "Chưa có tóm tắt buổi tập."}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ))
                )
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {isPt
                      ? "Chưa có lịch hẹn trainee nào trong ngày này."
                      : "Chưa có lịch hỗ trợ PT nào trong ngày này."}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={detailOpen}
        transparent
        animationType="slide"
        onRequestClose={() => closeDetailModal()}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>Chi tiết buổi tập</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedAssistSchedule?.title || "Lịch hẹn trainee"}
                </Text>
              </View>
              <Pressable onPress={() => closeDetailModal()} style={styles.modalCloseButton}>
                <Ionicons name="close" size={22} color="#F8FAFC" />
              </Pressable>
            </View>

            {selectedAssistSchedule ? (
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.detailInfoCard}>
                  <Text style={styles.detailInfoLabel}>Học viên</Text>
                  <Text style={styles.detailInfoValue}>
                    {getTraineeName(selectedAssistSchedule)}
                  </Text>
                </View>

                <View style={styles.detailInfoCard}>
                  <Text style={styles.detailInfoLabel}>Email</Text>
                  <Text style={styles.detailInfoValue}>
                    {selectedAssistSchedule.extendedProps.account.email}
                  </Text>
                </View>

                <View style={styles.detailInfoCard}>
                  <Text style={styles.detailInfoLabel}>Thời gian</Text>
                  <Text style={styles.detailInfoValue}>
                    {formatDisplayDate(selectedAssistSchedule.start)}
                  </Text>
                  <Text style={styles.detailInfoSecondary}>
                    {formatSessionTime(selectedAssistSchedule.start, selectedAssistSchedule.end)}
                  </Text>
                </View>

                <View style={styles.detailInfoCard}>
                  <Text style={styles.detailInfoLabel}>Chi nhánh</Text>
                  <Text style={styles.detailInfoValue}>
                    {selectedAssistSchedule.extendedProps.branch.name}
                  </Text>
                </View>

                <View style={styles.detailInfoCard}>
                  <Text style={styles.detailInfoLabel}>Gói tập</Text>
                  <Text style={styles.detailInfoValue}>
                    {selectedAssistSchedule.extendedProps.userPackage.package.name}
                  </Text>
                </View>

                <View style={styles.detailInfoCard}>
                  <Text style={styles.detailInfoLabel}>Trạng thái</Text>
                  <Text
                    style={[
                      styles.detailStatusText,
                      {
                        color: getSessionStatusColor(
                          selectedAssistSchedule.extendedProps.status,
                        ),
                      },
                    ]}
                  >
                    {getSessionStatusLabel(selectedAssistSchedule.extendedProps.status)}
                  </Text>
                </View>

                {selectedAssistSchedule.extendedProps.note ? (
                  <View style={styles.detailInfoCard}>
                    <Text style={styles.detailInfoLabel}>Ghi chú</Text>
                    <Text style={styles.detailInfoValue}>
                      {selectedAssistSchedule.extendedProps.note}
                    </Text>
                  </View>
                ) : null}

                {selectedAssistSchedule.extendedProps.rejectReason ? (
                  <View style={styles.detailInfoCard}>
                    <Text style={styles.detailRejectLabel}>Lý do từ chối</Text>
                    <Text style={styles.detailInfoValue}>
                      {selectedAssistSchedule.extendedProps.rejectReason}
                    </Text>
                  </View>
                ) : null}
              </ScrollView>
            ) : null}

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalSecondaryButton}
                onPress={() => closeDetailModal()}
              >
                <Text style={styles.modalSecondaryButtonText}>Đóng</Text>
              </Pressable>
              <Pressable style={styles.modalPrimaryButton} onPress={openFeedbackModal}>
                <Text style={styles.modalPrimaryButtonText}>Nhận xét</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={feedbackOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setFeedbackOpen(false);
          setSelectedAssistSchedule(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>Nhận xét buổi tập</Text>
                <Text style={styles.modalSubtitle}>
                  Gửi đánh giá sau buổi tập với trainee
                </Text>
              </View>
              <Pressable
                onPress={() => setFeedbackOpen(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={22} color="#F8FAFC" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.formLabel}>Hoàn thành buổi</Text>
              <View style={styles.completionRow}>
                {[
                  { key: "COMPLETED" as CompletionStatus, label: "Hoàn thành" },
                  { key: "INCOMPLETE" as CompletionStatus, label: "Chưa hoàn thành" },
                ].map((item) => {
                  const isActive = feedbackForm.completion === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      style={[
                        styles.completionChip,
                        isActive && styles.completionChipActive,
                      ]}
                      onPress={() =>
                        setFeedbackForm((prev) => ({
                          ...prev,
                          completion: item.key,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.completionChipText,
                          isActive && styles.completionChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.formLabel}>Tóm tắt buổi tập</Text>
              <TextInput
                value={feedbackForm.summary}
                onChangeText={(value) =>
                  setFeedbackForm((prev) => ({ ...prev, summary: value }))
                }
                placeholder="Tổng quan buổi tập..."
                placeholderTextColor="#64748B"
                multiline
                style={styles.feedbackInput}
              />

              <Text style={styles.formLabel}>Kỹ thuật</Text>
              <TextInput
                value={feedbackForm.techniqueNote}
                onChangeText={(value) =>
                  setFeedbackForm((prev) => ({ ...prev, techniqueNote: value }))
                }
                placeholder="Điểm cần lưu ý về kỹ thuật..."
                placeholderTextColor="#64748B"
                multiline
                style={styles.feedbackInput}
              />

              <Text style={styles.formLabel}>Cần cải thiện</Text>
              <TextInput
                value={feedbackForm.improvement}
                onChangeText={(value) =>
                  setFeedbackForm((prev) => ({ ...prev, improvement: value }))
                }
                placeholder="Những điểm cần cải thiện..."
                placeholderTextColor="#64748B"
                multiline
                style={styles.feedbackInput}
              />

              <Text style={styles.formLabel}>Kế hoạch buổi sau</Text>
              <TextInput
                value={feedbackForm.nextSessionPlan}
                onChangeText={(value) =>
                  setFeedbackForm((prev) => ({ ...prev, nextSessionPlan: value }))
                }
                placeholder="Kế hoạch cho buổi kế tiếp..."
                placeholderTextColor="#64748B"
                multiline
                style={styles.feedbackInput}
              />

              <Text style={styles.formLabel}>Cân nặng (kg)</Text>
              <TextInput
                value={feedbackForm.weightKg ? String(feedbackForm.weightKg) : ""}
                onChangeText={(value) =>
                  setFeedbackForm((prev) => ({
                    ...prev,
                    weightKg: Number(value.replace(",", ".")) || 0,
                  }))
                }
                placeholder="70"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
                style={styles.feedbackSingleInput}
              />

              <Text style={styles.formLabel}>Ghi chú cơ thể</Text>
              <TextInput
                value={feedbackForm.bodyNote}
                onChangeText={(value) =>
                  setFeedbackForm((prev) => ({ ...prev, bodyNote: value }))
                }
                placeholder="Tình trạng sức khỏe, đau nhức..."
                placeholderTextColor="#64748B"
                multiline
                style={styles.feedbackInput}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalSecondaryButton}
                onPress={() => {
                  setFeedbackOpen(false);
                  setSelectedAssistSchedule(null);
                }}
              >
                <Text style={styles.modalSecondaryButtonText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={styles.modalPrimaryButton}
                onPress={handleSubmitFeedback}
                disabled={reportSessionMutation.isPending}
              >
                {reportSessionMutation.isPending ? (
                  <ActivityIndicator color="#08110A" />
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>Gửi</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  tabsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  tabText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#08110A",
  },
  calendarCard: {
    borderRadius: 24,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginBottom: 20,
  },
  calendar: {
    borderRadius: 24,
    paddingBottom: 12,
  },
  stateBox: {
    minHeight: 360,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateTitle: {
    color: "#F8FAFC",
    fontSize: 18,
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
  summaryCard: {
    borderRadius: 24,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
  },
  summaryTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  summarySubtitle: {
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  checkInItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#182235",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 12,
  },
  checkInBranch: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  checkInMeta: {
    color: "#94A3B8",
    fontSize: 13,
  },
  timeBadge: {
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.16)",
    alignItems: "center",
  },
  timeText: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyState: {
    backgroundColor: "#182235",
    borderRadius: 18,
    padding: 18,
  },
  emptyStateText: {
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  ptSessionCard: {
    backgroundColor: "#182235",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  ptSessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  ptSessionHeaderContent: {
    flex: 1,
  },
  ptSessionTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  ptSessionMeta: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
  },
  ptStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ptStatusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  ptDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  ptDetailText: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  ptNoteBox: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  ptNoteLabel: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  ptRejectLabel: {
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  ptNoteText: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
  },
  ptReportBox: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: "rgba(34,197,94,0.10)",
    padding: 12,
  },
  ptReportTitle: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  ptReportText: {
    color: "#DCFCE7",
    fontSize: 13,
    lineHeight: 20,
  },
  detailActionRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailActionText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,8,23,0.72)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "88%",
    backgroundColor: "#101826",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  modalSubtitle: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
  },
  modalCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1A2332",
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: {
    maxHeight: 500,
  },
  modalScrollContent: {
    paddingBottom: 8,
  },
  detailInfoCard: {
    borderRadius: 18,
    backgroundColor: "#182235",
    padding: 14,
    marginBottom: 10,
  },
  detailInfoLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  detailRejectLabel: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },
  detailInfoValue: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  detailInfoSecondary: {
    color: "#CBD5E1",
    fontSize: 13,
    marginTop: 4,
  },
  detailStatusText: {
    fontSize: 15,
    fontWeight: "800",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  modalSecondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#182235",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryButtonText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
  },
  modalPrimaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryButtonText: {
    color: "#08110A",
    fontSize: 15,
    fontWeight: "800",
  },
  formLabel: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
    marginTop: 6,
  },
  completionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  completionChip: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#182235",
    alignItems: "center",
    justifyContent: "center",
  },
  completionChipActive: {
    backgroundColor: "#22C55E",
  },
  completionChipText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "800",
  },
  completionChipTextActive: {
    color: "#08110A",
  },
  feedbackInput: {
    minHeight: 82,
    borderRadius: 18,
    backgroundColor: "#182235",
    color: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
    fontSize: 14,
    marginBottom: 8,
  },
  feedbackSingleInput: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#182235",
    color: "#F8FAFC",
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 8,
  },
});
