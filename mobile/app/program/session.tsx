import { APP_ROUTES } from "@/constants/appRoute";
import { createWorkoutHistory, getMyPurchasePackages, getPrograms } from "@/services/api";
import { Exercise, MyPurchasePackage, Program, ProgramDay, ProgramDayExercise } from "@/types/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type DurationMap = Record<string, number>;

const getStringParam = (param?: string | string[]) =>
  Array.isArray(param) ? (param[0] ?? "") : (param ?? "");

const sortDays = (days: ProgramDay[]) => [...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
const sortExercises = (items: ProgramDayExercise[]) =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder);

const formatTime = (seconds: number) => {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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

const getLevelLabel = (level: Exercise["level"]) => {
  switch (level) {
    case "BEGINNER":
      return "Cơ bản";
    case "INTERMEDIATE":
      return "Trung cấp";
    case "ADVANCED":
      return "Nâng cao";
    default:
      return level;
  }
};

const defaultDurationMap = (days: ProgramDay[]) =>
  Object.fromEntries(
    sortDays(days).flatMap((day) => sortExercises(day.exercises ?? []).map((row) => [row.id, 10])),
  ) as DurationMap;

export default function ProgramSessionScreen() {
  const params = useLocalSearchParams<{
    programId?: string | string[];
    dayId?: string | string[];
    lessonId?: string | string[];
  }>();

  const programId = getStringParam(params.programId);
  const dayIdFromParams = getStringParam(params.dayId);
  const lessonIdFromParams = getStringParam(params.lessonId);

  const [activeDayId, setActiveDayId] = useState("");
  const [activeLessonId, setActiveLessonId] = useState("");
  const [durationMap, setDurationMap] = useState<DurationMap>({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [setupOpen, setSetupOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState("");

  const { data, isLoading, isError, refetch: refetchPrograms } = useQuery({
    queryKey: ["programs", "session-source"],
    queryFn: () => getPrograms({ page: 1, itemsPerPage: 100 }),
  });
  const { data: purchasesRes, refetch: refetchPackages } = useQuery({
    queryKey: ["my-packages", "for-learning"],
    queryFn: () => getMyPurchasePackages(),
  });

  const handleRefreshSession = useCallback(async () => {
    await Promise.all([refetchPrograms(), refetchPackages()]);
  }, [refetchPrograms, refetchPackages]);

  const { refreshControl } = usePullToRefresh(handleRefreshSession);

  const programs = useMemo(() => data?.data ?? [], [data]);
  const program = useMemo<Program | undefined>(
    () => programs.find((item: Program) => item.id === programId),
    [programId, programs],
  );
  const sortedDays = useMemo(() => sortDays(program?.days ?? []), [program?.days]);

  useEffect(() => {
    if (!sortedDays.length) return;
    setActiveDayId((prev) => {
      if (prev && sortedDays.some((day) => day.id === prev)) return prev;
      if (dayIdFromParams && sortedDays.some((day) => day.id === dayIdFromParams)) {
        return dayIdFromParams;
      }
      return sortedDays[0].id;
    });
  }, [dayIdFromParams, sortedDays]);

  const currentDay = useMemo(
    () => sortedDays.find((day) => day.id === activeDayId) ?? sortedDays[0] ?? null,
    [activeDayId, sortedDays],
  );
  const currentDayLessons = useMemo(
    () => sortExercises(currentDay?.exercises ?? []),
    [currentDay],
  );

  useEffect(() => {
    if (!program) return;
    setDurationMap((prev) =>
      Object.keys(prev).length ? prev : defaultDurationMap(program.days ?? []),
    );
  }, [program]);

  useEffect(() => {
    if (!currentDayLessons.length) {
      setActiveLessonId("");
      return;
    }
    setActiveLessonId((prev) => {
      if (prev && currentDayLessons.some((row) => row.id === prev)) return prev;
      if (lessonIdFromParams && currentDayLessons.some((row) => row.id === lessonIdFromParams)) {
        return lessonIdFromParams;
      }
      return currentDayLessons[0].id;
    });
  }, [currentDayLessons, lessonIdFromParams]);

  const selectedLesson = useMemo(
    () => currentDayLessons.find((row) => row.id === activeLessonId) ?? currentDayLessons[0] ?? null,
    [activeLessonId, currentDayLessons],
  );
  const currentExercise = selectedLesson?.exercise ?? null;

  useEffect(() => {
    if (!selectedLesson) return;
    setTimerRunning(false);
    setRemainingSeconds((durationMap[selectedLesson.id] ?? 10) * 60);
  }, [selectedLesson, durationMap]);

  useEffect(() => {
    if (!timerRunning || !selectedLesson) return;
    const id = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [selectedLesson, timerRunning]);

  const currentDayCompletedCount = useMemo(
    () => currentDayLessons.filter((row) => completedLessonIds.includes(row.id)).length,
    [completedLessonIds, currentDayLessons],
  );
  const currentDayPercent = currentDayLessons.length
    ? Math.round((currentDayCompletedCount / currentDayLessons.length) * 100)
    : 0;

  const activePackageMatch = useMemo(() => {
    const packages: MyPurchasePackage[] = purchasesRes?.data ?? [];
    return (
      packages.find((pkg) => pkg.status === "ACTIVE" && pkg.programId === program?.id) ?? null
    );
  }, [program?.id, purchasesRes?.data]);

  const confirmWorkoutMutation = useMutation({
    mutationFn: createWorkoutHistory,
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Đã lưu lịch sử tập luyện",
        text2: "Buổi tập của bạn đã được đồng bộ thành công.",
      });
      setConfirmOpen(false);
      setCompletionNote("");
    },
    onError: () => {
      Toast.show({
        type: "error",
        text1: "Không thể đồng bộ buổi tập",
        text2: "Vui lòng thử lại sau.",
      });
    },
  });

  const handleResetTimer = () => {
    if (!selectedLesson) return;
    setTimerRunning(false);
    setRemainingSeconds((durationMap[selectedLesson.id] ?? 10) * 60);
  };

  const handleMarkCurrentLessonComplete = () => {
    if (!selectedLesson) return;
    setCompletedLessonIds((prev) =>
      prev.includes(selectedLesson.id) ? prev : [...prev, selectedLesson.id],
    );

    const nextLesson = currentDayLessons.find(
      (row) => row.id !== selectedLesson.id && !completedLessonIds.includes(row.id),
    );
    if (nextLesson) {
      setActiveLessonId(nextLesson.id);
    }
  };

  const handleConfirmWorkout = () => {
    if (!currentDay) return;

    if (!activePackageMatch?.id) {
      Toast.show({
        type: "success",
        text1: "Đã xác nhận hoàn thành buổi tập",
        text2: "Chưa thể đồng bộ API vì chương trình này chưa gắn với gói active.",
      });
      setConfirmOpen(false);
      setCompletionNote("");
      return;
    }

    confirmWorkoutMutation.mutate({
      userPackageId: activePackageMatch.id,
      programDayId: currentDay.id,
      workoutAt: new Date().toISOString(),
      status: "COMPLETED",
      note: completionNote.trim() || null,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.stateContainer}
          refreshControl={refreshControl}
        >
          <ActivityIndicator size="large" color="#A435F0" />
          <Text style={styles.stateText}>Đang chuẩn bị khóa học...</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !program || !currentDay || !selectedLesson || !currentExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.stateContainer}
          refreshControl={refreshControl}
        >
          <Text style={styles.errorTitle}>Không thể mở buổi học</Text>
          <Text style={styles.stateText}>
            Không tìm thấy nội dung chương trình hoặc bài học được chọn.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Quay lại</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {program.name}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {getDayLabel(currentDay.dayOfWeek)} • {currentDay.title}
          </Text>
        </View>

        <Pressable onPress={() => setSetupOpen(true)} style={styles.headerButton}>
          <Ionicons name="options-outline" size={20} color="#F8FAFC" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={refreshControl}
      >
        <View style={styles.videoCard}>
          <Image source={{ uri: currentExercise.thumbnail }} style={styles.videoImage} contentFit="cover" />
          <View style={styles.videoOverlay} />
          <Pressable
            style={styles.playOverlay}
            onPress={() =>
              router.push({
                pathname: APP_ROUTES.EXERCISE_DETAIL,
                params: { id: currentExercise.id },
              })
            }
          >
            <Ionicons name="play" size={26} color="#F8FAFC" />
          </Pressable>
          <View style={styles.videoMeta}>
            <Text style={styles.lessonEyebrow}>Bài học hiện tại</Text>
            <Text style={styles.lessonTitle}>{currentExercise.name}</Text>
            <Text style={styles.lessonSubtitle}>
              {getLevelLabel(currentExercise.level)} • {durationMap[selectedLesson.id] ?? 10} phút
            </Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Tiến độ buổi học</Text>
            <Text style={styles.progressValue}>{currentDayCompletedCount}/{currentDayLessons.length}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${currentDayPercent}%` }]} />
          </View>
          <Text style={styles.progressHint}>
            Hoàn thành {currentDayCompletedCount}/{currentDayLessons.length} bài của buổi này.
          </Text>
        </View>

        <View style={styles.timerCard}>
          <Text style={styles.timerValue}>{formatTime(remainingSeconds)}</Text>
          <Text style={styles.timerHint}>
            Mục tiêu cho bài hiện tại: {durationMap[selectedLesson.id] ?? 10} phút
          </Text>

          <View style={styles.controlsRow}>
            <Pressable
              style={styles.controlButton}
              onPress={() => setTimerRunning(true)}
              disabled={timerRunning}
            >
              <Ionicons name="play" size={22} color="#08110A" />
            </Pressable>
            <Pressable
              style={[styles.controlButton, styles.secondaryControl]}
              onPress={() => setTimerRunning(false)}
            >
              <Ionicons name="pause" size={22} color="#F8FAFC" />
            </Pressable>
            <Pressable
              style={[styles.controlButton, styles.secondaryControl]}
              onPress={handleResetTimer}
            >
              <Ionicons name="refresh" size={22} color="#F8FAFC" />
            </Pressable>
          </View>

          <View style={styles.actionStack}>
            <Pressable style={styles.primaryButton} onPress={handleMarkCurrentLessonComplete}>
              <Text style={styles.primaryButtonText}>
                {completedLessonIds.includes(selectedLesson.id)
                  ? "Đã hoàn thành bài này"
                  : "Hoàn thành bài hiện tại"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButtonWide}
              onPress={() => setConfirmOpen(true)}
            >
              <Text style={styles.secondaryButtonWideText}>
                Xác nhận hoàn thành buổi tập
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.curriculumCard}>
          <Text style={styles.curriculumTitle}>Nội dung khóa học</Text>
          <Text style={styles.curriculumSubtitle}>
            Chọn bài học để xem và tập như một khóa học mobile.
          </Text>

          {sortDays(program.days ?? []).map((day) => {
            const rows = sortExercises(day.exercises ?? []);
            const isActiveDay = currentDay.id === day.id;

            return (
              <View key={day.id} style={styles.daySection}>
                <Pressable
                  style={[styles.daySectionHeader, isActiveDay && styles.daySectionHeaderActive]}
                  onPress={() => setActiveDayId(day.id)}
                >
                  <View>
                    <Text style={styles.daySectionTitle}>
                      {getDayLabel(day.dayOfWeek)} - {day.title}
                    </Text>
                    <Text style={styles.daySectionMeta}>{rows.length} bài học</Text>
                  </View>
                  <Ionicons
                    name={isActiveDay ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={isActiveDay ? "#A435F0" : "#64748B"}
                  />
                </Pressable>

                {isActiveDay && (
                  <View style={styles.lessonList}>
                    {rows.map((row) => {
                      const isCurrent = selectedLesson.id === row.id;
                      const isDone = completedLessonIds.includes(row.id);

                      return (
                        <Pressable
                          key={row.id}
                          style={[
                            styles.lessonRow,
                            isCurrent && styles.lessonRowActive,
                          ]}
                          onPress={() => setActiveLessonId(row.id)}
                        >
                          <View style={styles.lessonRowIcon}>
                            <Text style={styles.lessonRowIconText}>{row.sortOrder}</Text>
                          </View>

                          <View style={styles.lessonRowContent}>
                            <Text style={styles.lessonRowTitle}>{row.exercise.name}</Text>
                            <Text style={styles.lessonRowMeta}>
                              {getLevelLabel(row.exercise.level)} • {durationMap[row.id] ?? 10} phút
                            </Text>
                          </View>

                          <Ionicons
                            name={isDone ? "checkmark-circle" : "play-circle-outline"}
                            size={24}
                            color={isDone ? "#22C55E" : "#A435F0"}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={setupOpen} transparent animationType="slide" onRequestClose={() => setSetupOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chỉnh thời gian từng bài</Text>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {sortDays(program.days ?? []).map((day) => {
                const rows = sortExercises(day.exercises ?? []);
                return (
                  <View key={day.id} style={styles.setupSection}>
                    <Text style={styles.setupSectionTitle}>
                      {getDayLabel(day.dayOfWeek)} - {day.title}
                    </Text>
                    {rows.map((row) => (
                      <View key={row.id} style={styles.setupRow}>
                        <View style={styles.setupRowContent}>
                          <Text style={styles.setupRowTitle}>
                            {row.sortOrder}. {row.exercise.name}
                          </Text>
                          <Text style={styles.setupRowMeta}>
                            {getLevelLabel(row.exercise.level)}
                          </Text>
                        </View>

                        <View style={styles.durationPicker}>
                          {[5, 10, 15].map((minutes) => {
                            const isActive = (durationMap[row.id] ?? 10) === minutes;
                            return (
                              <Pressable
                                key={minutes}
                                style={[
                                  styles.durationMinuteChip,
                                  isActive && styles.durationMinuteChipActive,
                                ]}
                                onPress={() =>
                                  setDurationMap((prev) => ({
                                    ...prev,
                                    [row.id]: minutes,
                                  }))
                                }
                              >
                                <Text
                                  style={[
                                    styles.durationMinuteText,
                                    isActive && styles.durationMinuteTextActive,
                                  ]}
                                >
                                  {minutes}p
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })}
            </ScrollView>

            <Pressable style={styles.primaryButton} onPress={() => setSetupOpen(false)}>
              <Text style={styles.primaryButtonText}>Xong</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmOpen} transparent animationType="slide" onRequestClose={() => setConfirmOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Xác nhận hoàn thành buổi tập</Text>
            <Text style={styles.modalDescription}>
              {`Bạn xác nhận đã hoàn thành buổi "${currentDay.title}"?`}
            </Text>
            {!activePackageMatch?.id && (
              <Text style={styles.warningText}>
                Chương trình này chưa gắn với gói active nên app chỉ xác nhận local, chưa đồng bộ API.
              </Text>
            )}
            <TextInput
              value={completionNote}
              onChangeText={setCompletionNote}
              multiline
              placeholder="Ghi chú buổi tập (không bắt buộc)"
              placeholderTextColor="#64748B"
              style={styles.noteInput}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryModalButton}
                onPress={() => setConfirmOpen(false)}
              >
                <Text style={styles.secondaryModalButtonText}>Để sau</Text>
              </Pressable>
              <Pressable
                style={styles.primaryModalButton}
                onPress={handleConfirmWorkout}
                disabled={confirmWorkoutMutation.isPending}
              >
                {confirmWorkoutMutation.isPending ? (
                  <ActivityIndicator color="#08110A" />
                ) : (
                  <Text style={styles.primaryModalButtonText}>Xác nhận</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  videoCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#101826",
    marginBottom: 16,
  },
  videoImage: {
    width: "100%",
    height: 240,
    backgroundColor: "#111827",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,8,23,0.24)",
  },
  playOverlay: {
    position: "absolute",
    top: "38%",
    left: "50%",
    transform: [{ translateX: -34 }, { translateY: -34 }],
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(0,0,0,0.48)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoMeta: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
  },
  lessonEyebrow: {
    color: "#D8B4FE",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  lessonTitle: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
  },
  lessonSubtitle: {
    color: "#E2E8F0",
    fontSize: 13,
  },
  progressCard: {
    borderRadius: 22,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
  },
  progressValue: {
    color: "#A435F0",
    fontSize: 15,
    fontWeight: "800",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#182235",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#A435F0",
  },
  progressHint: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 10,
  },
  timerCard: {
    borderRadius: 22,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    marginBottom: 16,
    alignItems: "center",
  },
  timerValue: {
    color: "#F8FAFC",
    fontSize: 54,
    fontWeight: "900",
    marginBottom: 8,
  },
  timerHint: {
    color: "#94A3B8",
    fontSize: 14,
    marginBottom: 18,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  controlButton: {
    minWidth: 72,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#A435F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  secondaryControl: {
    backgroundColor: "#182235",
  },
  actionStack: {
    width: "100%",
    gap: 10,
  },
  primaryButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#08110A",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButtonWide: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#A435F0",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonWideText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
  },
  curriculumCard: {
    borderRadius: 24,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
  },
  curriculumTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  curriculumSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  daySection: {
    marginBottom: 12,
  },
  daySectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#182235",
  },
  daySectionHeaderActive: {
    borderWidth: 1,
    borderColor: "#A435F0",
  },
  daySectionTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  daySectionMeta: {
    color: "#94A3B8",
    fontSize: 12,
  },
  lessonList: {
    marginTop: 10,
    gap: 10,
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  lessonRowActive: {
    borderWidth: 1,
    borderColor: "#A435F0",
  },
  lessonRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#182235",
    alignItems: "center",
    justifyContent: "center",
  },
  lessonRowIconText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
  },
  lessonRowContent: {
    flex: 1,
  },
  lessonRowTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  lessonRowMeta: {
    color: "#94A3B8",
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,8,23,0.70)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "82%",
    backgroundColor: "#101826",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  modalTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  modalDescription: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  warningText: {
    color: "#FBBF24",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  modalScroll: {
    marginBottom: 16,
  },
  modalScrollContent: {
    paddingBottom: 4,
  },
  setupSection: {
    marginBottom: 18,
  },
  setupSectionTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
  },
  setupRow: {
    borderRadius: 18,
    backgroundColor: "#182235",
    padding: 12,
    marginBottom: 10,
  },
  setupRowContent: {
    marginBottom: 10,
  },
  setupRowTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  setupRowMeta: {
    color: "#94A3B8",
    fontSize: 12,
  },
  durationPicker: {
    flexDirection: "row",
    gap: 8,
  },
  durationMinuteChip: {
    flex: 1,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  durationMinuteChipActive: {
    backgroundColor: "#A435F0",
  },
  durationMinuteText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "800",
  },
  durationMinuteTextActive: {
    color: "#F8FAFC",
  },
  noteInput: {
    minHeight: 96,
    borderRadius: 18,
    backgroundColor: "#182235",
    color: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryModalButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#182235",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryModalButtonText: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
  },
  primaryModalButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryModalButtonText: {
    color: "#08110A",
    fontSize: 14,
    fontWeight: "800",
  },
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
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
    marginBottom: 16,
  },
});
