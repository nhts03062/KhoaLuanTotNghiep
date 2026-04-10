import { APP_ROUTES } from "@/constants/appRoute";
import { getExercises, getPrograms } from "@/services/api";
import { Exercise, Program } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type WorkoutTab = "exercises" | "programs";

const workoutTabs: { key: WorkoutTab; label: string }[] = [
  { key: "exercises", label: "Bài tập" },
  { key: "programs", label: "Chương trình tập" },
];

const getLevelLabel = (level: Exercise["level"] | Program["level"]) => {
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

function ExerciseCard({ item }: { item: Exercise }) {
  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: APP_ROUTES.EXERCISE_DETAIL,
          params: { id: item.id },
        })
      }
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} contentFit="cover" />

      <View style={styles.cardBody}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{getLevelLabel(item.level)}</Text>
          </View>
          <View style={styles.badgeMuted}>
            <Text style={styles.badgeMutedText}>
              {getMuscleGroupLabel(item.muscleGroup)}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.footerLabel} numberOfLines={1}>
            Dụng cụ: {item.equipments || "Không yêu cầu"}
          </Text>
          <Text style={styles.linkText}>Xem video</Text>
        </View>
      </View>
    </Pressable>
  );
}

function ProgramCard({ item }: { item: Program }) {
  const totalExercises = useMemo(
    () =>
      item.days.reduce((count, day) => count + day.exercises.length, 0),
    [item.days],
  );

  return (
    <Pressable
      style={styles.programCourseCard}
      onPress={() =>
        router.push({
          pathname: APP_ROUTES.PROGRAM_DETAIL,
          params: { id: item.id },
        })
      }
    >
      <Image source={{ uri: item.thumbnail }} style={styles.programHero} contentFit="cover" />

      <View style={styles.programOverlay} />

      <View style={styles.programCourseBody}>
        <View style={styles.programTopMeta}>
          <View style={styles.programBadge}>
            <Text style={styles.programBadgeText}>{getLevelLabel(item.level)}</Text>
          </View>
          <View style={styles.programBadgeMuted}>
            <Text style={styles.programBadgeMutedText}>
              {item.daysPerWeek} buổi / tuần
            </Text>
          </View>
        </View>

        <Text style={styles.programCourseTitle}>{item.name}</Text>
        <Text style={styles.programCourseDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.programCourseStats}>
          <View style={styles.programCourseStatItem}>
            <Text style={styles.programCourseStatValue}>{item.days.length}</Text>
            <Text style={styles.programCourseStatLabel}>Chương</Text>
          </View>
          <View style={styles.programCourseStatItem}>
            <Text style={styles.programCourseStatValue}>{totalExercises}</Text>
            <Text style={styles.programCourseStatLabel}>Bài học</Text>
          </View>
        </View>

        <View style={styles.programActionRow}>
          <Text style={styles.programAuthorText}>BestGym Coach Series</Text>
          <Text style={styles.programLinkText}>Xem khóa học</Text>
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export default function WorkoutScreen() {
  const [activeTab, setActiveTab] = useState<WorkoutTab>("exercises");

  const {
    data: exercisesResponse,
    isLoading: isLoadingExercises,
    isError: isExercisesError,
    refetch: refetchExercises,
  } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => getExercises({ page: 1, itemsPerPage: 20 }),
  });

  const {
    data: programsResponse,
    isLoading: isLoadingPrograms,
    isError: isProgramsError,
    refetch: refetchPrograms,
  } = useQuery({
    queryKey: ["programs"],
    queryFn: () => getPrograms({ page: 1, itemsPerPage: 20 }),
  });

  const handleRefreshWorkout = useCallback(async () => {
    await Promise.all([refetchExercises(), refetchPrograms()]);
  }, [refetchExercises, refetchPrograms]);

  const { refreshControl } = usePullToRefresh(handleRefreshWorkout);

  const exercises = useMemo(
    () => exercisesResponse?.data ?? [],
    [exercisesResponse],
  );
  const programs = useMemo(() => programsResponse?.data ?? [], [programsResponse]);

  const isExercisesTab = activeTab === "exercises";
  const isLoading = isExercisesTab ? isLoadingExercises : isLoadingPrograms;
  const isError = isExercisesTab ? isExercisesError : isProgramsError;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Workout</Text>
        <Text style={styles.screenSubtitle}>
          Khám phá bài tập và chương trình tập phù hợp với mục tiêu của bạn.
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        {workoutTabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <Pressable
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <ScrollView
          contentContainerStyle={styles.stateContainer}
          refreshControl={refreshControl}
        >
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.stateText}>Đang tải dữ liệu workout...</Text>
        </ScrollView>
      ) : isError ? (
        <ScrollView
          contentContainerStyle={styles.stateContainer}
          refreshControl={refreshControl}
        >
          <Text style={styles.errorTitle}>Không tải được dữ liệu</Text>
          <Text style={styles.stateText}>
            Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.
          </Text>
        </ScrollView>
      ) : isExercisesTab ? (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ExerciseCard item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListEmptyComponent={
            <EmptyState message="Hiện chưa có bài tập nào để hiển thị." />
          }
        />
      ) : (
        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProgramCard item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListEmptyComponent={
            <EmptyState message="Hiện chưa có chương trình tập nào để hiển thị." />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020817",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },
  screenTitle: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  screenSubtitle: {
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    height: 48,
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
    fontSize: 15,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#08110A",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  thumbnail: {
    width: "100%",
    height: 180,
    backgroundColor: "#111827",
  },
  cardBody: {
    padding: 18,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },
  badgeText: {
    color: "#08110A",
    fontSize: 12,
    fontWeight: "800",
  },
  badgeMuted: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#182235",
  },
  badgeMutedText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
  },
  cardTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  cardDescription: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  footerLabel: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "600",
  },
  linkText: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "800",
  },
  programStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  programStatCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#182235",
    paddingVertical: 14,
    alignItems: "center",
  },
  programStatValue: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  programStatLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  programActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  programCourseCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  programHero: {
    width: "100%",
    height: 220,
    backgroundColor: "#111827",
  },
  programOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,8,23,0.28)",
  },
  programCourseBody: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
  },
  programTopMeta: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  programBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#A435F0",
  },
  programBadgeText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "800",
  },
  programBadgeMuted: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.72)",
  },
  programBadgeMutedText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "700",
  },
  programCourseTitle: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  programCourseDescription: {
    color: "#E2E8F0",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  programCourseStats: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  programCourseStatItem: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.72)",
    paddingVertical: 12,
    alignItems: "center",
  },
  programCourseStatValue: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  programCourseStatLabel: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
  },
  programAuthorText: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "600",
  },
  programLinkText: {
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
