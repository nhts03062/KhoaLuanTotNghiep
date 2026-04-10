import { APP_ROUTES } from "@/constants/appRoute";
import { getPrograms } from "@/services/api";
import { Exercise, Program, ProgramDay, ProgramDayExercise } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getStringParam = (param?: string | string[]) =>
  Array.isArray(param) ? (param[0] ?? "") : (param ?? "");

const sortDays = (days: ProgramDay[]) => [...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
const sortExercises = (items: ProgramDayExercise[]) =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder);

const getLevelLabel = (level: Program["level"] | Exercise["level"]) => {
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

const getMuscleGroupLabel = (muscleGroup: Exercise["muscleGroup"]) => {
  switch (muscleGroup) {
    case "CHEST":
      return "Ngực";
    case "BACK":
      return "Lưng";
    case "ARMS":
      return "Tay";
    case "LEGS":
      return "Chân";
    case "ABS":
      return "Bụng";
    case "CORE":
      return "Core";
    case "CARDIO":
      return "Cardio";
    default:
      return muscleGroup;
  }
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

const estimateDayMinutes = (rows: ProgramDayExercise[]) => rows.length * 10;

export default function ProgramDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const programId = getStringParam(params.id);
  const [expandedDayId, setExpandedDayId] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["programs", "detail-source"],
    queryFn: () => getPrograms({ page: 1, itemsPerPage: 100 }),
  });

  const handleRefreshProgram = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const { refreshControl } = usePullToRefresh(handleRefreshProgram);

  const programs = useMemo(() => data?.data ?? [], [data]);
  const program = useMemo<Program | undefined>(
    () => programs.find((item: Program) => item.id === programId),
    [programId, programs],
  );

  const sortedDays = useMemo(() => sortDays(program?.days ?? []), [program?.days]);
  const totalLessons = useMemo(
    () => sortedDays.reduce((count, day) => count + day.exercises.length, 0),
    [sortedDays],
  );
  const previewDay = sortedDays[0] ?? null;

  useEffect(() => {
    if (sortedDays.length && !expandedDayId) {
      setExpandedDayId(sortedDays[0].id);
    }
  }, [expandedDayId, sortedDays]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.stateContainer}
          refreshControl={refreshControl}
        >
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.stateText}>Đang tải chương trình tập...</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !program) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.stateContainer}
          refreshControl={refreshControl}
        >
          <Text style={styles.errorTitle}>Không tải được chương trình tập</Text>
          <Text style={styles.stateText}>
            Vui lòng thử lại sau hoặc kiểm tra lại dữ liệu chương trình.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={refreshControl}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
          </Pressable>
          <Text style={styles.headerTitle}>Chương trình tập</Text>
          <View style={styles.headerButtonPlaceholder} />
        </View>

        <View style={styles.heroCard}>
          <Image source={{ uri: program.thumbnail }} style={styles.heroImage} contentFit="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroBody}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>{getLevelLabel(program.level)}</Text>
              </View>
              <View style={styles.secondaryBadge}>
                <Text style={styles.secondaryBadgeText}>
                  {program.daysPerWeek} ngày / tuần
                </Text>
              </View>
            </View>

            <Text style={styles.programName}>{program.name}</Text>
            <Text style={styles.programDescription}>{program.description}</Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{sortedDays.length}</Text>
                <Text style={styles.heroStatLabel}>Chương</Text>
              </View>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{totalLessons}</Text>
                <Text style={styles.heroStatLabel}>Bài học</Text>
              </View>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{totalLessons * 10}p</Text>
                <Text style={styles.heroStatLabel}>Ước tính</Text>
              </View>
            </View>
          </View>
        </View>

        {previewDay && (
          <View style={styles.calloutCard}>
            <View style={styles.calloutHeader}>
              <Text style={styles.calloutEyebrow}>Bắt đầu với</Text>
              <Text style={styles.calloutTitle}>
                {getDayLabel(previewDay.dayOfWeek)} - {previewDay.title}
              </Text>
              <Text style={styles.calloutSubtitle}>
                {previewDay.exercises.length} bài tập • khoảng{" "}
                {estimateDayMinutes(previewDay.exercises)} phút
              </Text>
            </View>

            <Pressable
              style={styles.primaryCta}
              onPress={() =>
                router.push({
                  pathname: APP_ROUTES.PROGRAM_SESSION,
                  params: { programId, dayId: previewDay.id },
                })
              }
            >
              <Text style={styles.primaryCtaText}>Bắt đầu học ngay</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bạn sẽ học được gì</Text>
          <View style={styles.learnCard}>
            <View style={styles.learnRow}>
              <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
              <Text style={styles.learnText}>
                Theo dõi giáo án theo ngày như một khóa học mobile.
              </Text>
            </View>
            <View style={styles.learnRow}>
              <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
              <Text style={styles.learnText}>
                Xem video từng bài, đếm thời gian tập và đánh dấu hoàn thành.
              </Text>
            </View>
            <View style={styles.learnRow}>
              <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
              <Text style={styles.learnText}>
                Học theo từng buổi với nội dung rõ ràng và tiến độ trực quan.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.curriculumHeader}>
            <View>
              <Text style={styles.sectionTitle}>Nội dung khóa học</Text>
              <Text style={styles.curriculumSubtitle}>
                {sortedDays.length} chương • {totalLessons} bài học
              </Text>
            </View>
          </View>

          {sortedDays.map((day) => {
            const rows = sortExercises(day.exercises ?? []);
            const isExpanded = expandedDayId === day.id;

            return (
              <View key={day.id} style={styles.dayCard}>
                <Pressable
                  style={styles.dayHeader}
                  onPress={() =>
                    setExpandedDayId((current) => (current === day.id ? "" : day.id))
                  }
                >
                  <View style={styles.dayHeaderContent}>
                    <Text style={styles.dayTitle}>
                      {getDayLabel(day.dayOfWeek)} - {day.title}
                    </Text>
                    <Text style={styles.dayMeta}>
                      {rows.length} bài • {estimateDayMinutes(rows)} phút
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#CBD5E1"
                  />
                </Pressable>

                {isExpanded && (
                  <View style={styles.lessonList}>
                    {day.note ? <Text style={styles.dayNote}>{day.note}</Text> : null}

                    {rows.map((row) => (
                      <Pressable
                        key={row.id}
                        style={styles.lessonItem}
                        onPress={() =>
                          router.push({
                            pathname: APP_ROUTES.PROGRAM_SESSION,
                            params: {
                              programId,
                              dayId: day.id,
                              lessonId: row.id,
                            },
                          })
                        }
                      >
                        <View style={styles.lessonIndex}>
                          <Text style={styles.lessonIndexText}>{row.sortOrder}</Text>
                        </View>

                        <View style={styles.lessonContent}>
                          <Text style={styles.lessonName}>{row.exercise.name}</Text>
                          <Text style={styles.lessonMeta}>
                            {getMuscleGroupLabel(row.exercise.muscleGroup)} •{" "}
                            {getLevelLabel(row.exercise.level)} • 10 phút
                          </Text>
                        </View>

                        <Ionicons name="play-circle-outline" size={24} color="#22C55E" />
                      </Pressable>
                    ))}

                    <Pressable
                      style={styles.outlineCta}
                      onPress={() =>
                        router.push({
                          pathname: APP_ROUTES.PROGRAM_SESSION,
                          params: { programId, dayId: day.id },
                        })
                      }
                    >
                      <Text style={styles.outlineCtaText}>Học ngày này</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </View>
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
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  headerButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
  },
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#101826",
    marginBottom: 18,
  },
  heroImage: {
    width: "100%",
    height: 260,
    backgroundColor: "#111827",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,8,23,0.30)",
  },
  heroBody: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
  },
  heroBadgeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  primaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },
  primaryBadgeText: {
    color: "#08110A",
    fontSize: 12,
    fontWeight: "800",
  },
  secondaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.72)",
  },
  secondaryBadgeText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "700",
  },
  programName: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  programDescription: {
    color: "#E2E8F0",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  heroStatItem: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "rgba(15,23,42,0.72)",
    paddingVertical: 12,
    alignItems: "center",
  },
  heroStatValue: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  heroStatLabel: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
  },
  calloutCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    marginBottom: 18,
  },
  calloutHeader: {
    marginBottom: 16,
  },
  calloutEyebrow: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  calloutTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  calloutSubtitle: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
  },
  primaryCta: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#A435F0",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryCtaText: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 6,
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 14,
  },
  learnCard: {
    borderRadius: 22,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
  },
  learnRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  learnText: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
  },
  curriculumHeader: {
    marginBottom: 12,
  },
  curriculumSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
  },
  dayCard: {
    borderRadius: 22,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dayHeaderContent: {
    flex: 1,
  },
  dayTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  dayMeta: {
    color: "#94A3B8",
    fontSize: 13,
  },
  lessonList: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    padding: 16,
  },
  dayNote: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  lessonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#182235",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  lessonIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  lessonIndexText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
  },
  lessonContent: {
    flex: 1,
  },
  lessonName: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  lessonMeta: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
  },
  outlineCta: {
    marginTop: 6,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#A435F0",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineCtaText: {
    color: "#E9D5FF",
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
  },
});
