import { getExerciseById } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const getStringParam = (param?: string | string[]) =>
  Array.isArray(param) ? (param[0] ?? "") : (param ?? "");

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");

    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    if (host.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return url;
      }

      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch {
    return url;
  }

  return url;
};

const getYoutubePlayerUrl = (url: string) => {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("playsinline", "1");
    parsed.searchParams.set("rel", "0");
    parsed.searchParams.set("modestbranding", "1");
    return parsed.toString();
  } catch {
    return url;
  }
};

const buildYoutubeHtml = (url: string) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1"
    />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #000;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      iframe {
        border: 0;
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <iframe
      src="${url}"
      title="Exercise video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>
  </body>
</html>`;

export default function ExerciseDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const exerciseId = getStringParam(params.id);
  const [playerError, setPlayerError] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["exercise-detail", exerciseId],
    queryFn: () => getExerciseById(exerciseId),
    enabled: !!exerciseId,
  });

  const handleRefreshExercise = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const { refreshControl } = usePullToRefresh(handleRefreshExercise);

  const exercise = data?.data;
  const embedUrl = useMemo(
    () => getYoutubeEmbedUrl(exercise?.videoUrl ?? ""),
    [exercise?.videoUrl],
  );
  const youtubePlayerUrl = useMemo(() => getYoutubePlayerUrl(embedUrl), [embedUrl]);
  const isYoutubeEmbed = useMemo(
    () => youtubePlayerUrl.includes("youtube.com/embed"),
    [youtubePlayerUrl],
  );
  const youtubeHtml = useMemo(
    () => buildYoutubeHtml(youtubePlayerUrl),
    [youtubePlayerUrl],
  );

  useEffect(() => {
    setPlayerError(false);
  }, [youtubePlayerUrl]);

  const handleOpenExternalVideo = async () => {
    const videoUrl = exercise?.videoUrl;
    if (!videoUrl) {
      return;
    }

    const supported = await Linking.canOpenURL(videoUrl);
    if (supported) {
      await Linking.openURL(videoUrl);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Video bài tập</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {exercise?.name || "Đang tải thông tin bài tập"}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <ScrollView
          contentContainerStyle={styles.stateContainer}
          refreshControl={refreshControl}
        >
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.stateText}>Đang tải video bài tập...</Text>
        </ScrollView>
      ) : isError || !exercise ? (
        <ScrollView
          contentContainerStyle={styles.stateContainer}
          refreshControl={refreshControl}
        >
          <Text style={styles.errorTitle}>Không tải được bài tập</Text>
          <Text style={styles.stateText}>
            Vui lòng thử lại sau hoặc kiểm tra lại dữ liệu video.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          <View style={styles.videoCard}>
            {embedUrl ? (
              <>
                <WebView
                  key={youtubePlayerUrl}
                  source={
                    isYoutubeEmbed
                      ? {
                          html: youtubeHtml,
                          baseUrl: "https://www.youtube.com",
                        }
                      : { uri: youtubePlayerUrl }
                  }
                  originWhitelist={["*"]}
                  style={styles.webview}
                  javaScriptEnabled
                  domStorageEnabled
                  allowsFullscreenVideo
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
                  onError={() => setPlayerError(true)}
                  onHttpError={() => setPlayerError(true)}
                />
                {playerError && (
                  <View style={styles.playerErrorOverlay}>
                    <Text style={styles.playerErrorTitle}>
                      Không thể phát video trong ứng dụng
                    </Text>
                    <Text style={styles.playerErrorText}>
                      Bạn có thể mở video trực tiếp trên YouTube để tiếp tục xem.
                    </Text>
                    <Pressable
                      onPress={handleOpenExternalVideo}
                      style={styles.youtubeButton}
                    >
                      <Text style={styles.youtubeButtonText}>Mở trên YouTube</Text>
                    </Pressable>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.stateContainer}>
                <Text style={styles.errorTitle}>Chưa có video</Text>
                <Text style={styles.stateText}>
                  Bài tập này hiện chưa được cấu hình video để phát.
                </Text>
              </View>
            )}
          </View>

          {!!exercise.videoUrl && !playerError && (
            <Pressable
              onPress={handleOpenExternalVideo}
              style={styles.externalLinkButton}
            >
              <Text style={styles.externalLinkButtonText}>Mở trên YouTube</Text>
            </Pressable>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exerciseMeta}>
              {exercise.level} • {exercise.muscleGroup}
            </Text>
            <Text style={styles.exerciseDescription}>{exercise.description}</Text>
            <Text style={styles.sectionTitle}>Gợi ý</Text>
            <Text style={styles.exerciseDescription}>{exercise.suggestion}</Text>
          </View>
        </ScrollView>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 14,
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  videoCard: {
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    aspectRatio: 16 / 9,
    marginBottom: 20,
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
  playerErrorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,8,23,0.92)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  playerErrorTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  playerErrorText: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 18,
  },
  youtubeButton: {
    minWidth: 180,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  youtubeButtonText: {
    color: "#08110A",
    fontSize: 14,
    fontWeight: "800",
  },
  externalLinkButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  externalLinkButtonText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
  },
  infoCard: {
    borderRadius: 24,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
  },
  exerciseName: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  exerciseMeta: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 16,
  },
  exerciseDescription: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
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
