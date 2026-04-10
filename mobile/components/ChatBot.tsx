import { recommendNutrition, recommendProgram } from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type ViewMode = "menu" | "chat";
type ChatScope = "packages" | "nutrition";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const QUICK_ACTIONS = [
  {
    key: "workout",
    title: "Gợi ý gói tập",
    description: "Gợi ý gói tập hoặc chương trình tập phù hợp",
    prompt:
      "Hãy gợi ý cho tôi gói tập hoặc chương trình tập phù hợp dựa trên hồ sơ hiện tại của tôi. Nếu thiếu dữ liệu quan trọng thì hãy hỏi lại thật ngắn gọn trước khi kết luận. Chỉ đề xuất tối đa 3 lựa chọn và nêu lý do.",
    icon: <Ionicons name="barbell-outline" size={22} color="#22C55E" />,
    scope: "packages" as const,
  },
  {
    key: "diet",
    title: "Gợi ý chế độ ăn",
    description: "Tư vấn calories, macro và thực đơn đơn giản",
    prompt:
      "Hãy gợi ý chế độ ăn phù hợp với hồ sơ hiện tại của tôi để hỗ trợ mục tiêu sức khỏe hoặc thể hình. Nếu đủ dữ liệu thì ước tính calories và macro; nếu thiếu dữ liệu quan trọng thì hỏi lại thật ngắn gọn trước khi kết luận.",
    icon: <Ionicons name="restaurant-outline" size={22} color="#22C55E" />,
    scope: "nutrition" as const,
  },
];

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object") {
    const maybeError = error as {
      message?: unknown;
      error?: unknown;
      response?: {
        data?: {
          message?: unknown;
          error?: unknown;
        };
      };
    };

    const responseMessage = maybeError.response?.data?.message;
    if (Array.isArray(responseMessage)) {
      return responseMessage.join(", ");
    }
    if (typeof responseMessage === "string") {
      return responseMessage;
    }
    if (typeof maybeError.message === "string") {
      return maybeError.message;
    }
    if (typeof maybeError.error === "string") {
      return maybeError.error;
    }
  }

  return "Không thể lấy phản hồi từ trợ lý AI.";
};

export default function ChatBot() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("menu");
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState(() => createId());
  const [chatScope, setChatScope] = useState<ChatScope>("packages");
  const scrollRef = useRef<ScrollView>(null);

  const welcomeText = useMemo(
    () =>
      accessToken
        ? "Xin chào! Tôi có thể gợi ý gói tập hoặc chế độ ăn dựa trên hồ sơ của bạn."
        : "Bạn cần đăng nhập để sử dụng BestGym AI.",
    [accessToken],
  );

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [isLoading, messages, view]);

  const resetConversation = () => {
    setMessages([]);
    setInput("");
    setConversationId(createId());
    setChatScope("packages");
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setView("menu");
      resetConversation();
    }, 150);
  };

  const sendMessage = async (content: string, scope?: ChatScope) => {
    const text = content.trim();
    if (!text) return;

    if (!accessToken) {
      Toast.show({
        type: "info",
        text1: "Cần đăng nhập",
        text2: "Vui lòng đăng nhập để sử dụng trợ lý AI.",
      });
      return;
    }

    const currentScope = scope ?? chatScope;
    if (scope) {
      setChatScope(scope);
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      text,
    };

    setView("chat");
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response =
        currentScope === "nutrition"
          ? await recommendNutrition({
              conversationId,
              userMessage: text,
            })
          : await recommendProgram({
              conversationId,
              userMessage: text,
            });

      const aiText = response?.data?.text;
      if (!aiText || typeof aiText !== "string") {
        throw new Error("AI chưa trả về nội dung hợp lệ.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          text: aiText,
        },
      ]);
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      Toast.show({
        type: "error",
        text1: "AI chưa phản hồi được",
        text2: errorMessage,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          text: `Xin lỗi, tôi chưa thể phản hồi lúc này. ${errorMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!accessToken) {
    return null;
  }

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        style={styles.fab}
        android_ripple={{ color: "rgba(255,255,255,0.12)", borderless: true }}
      >
        <MaterialCommunityIcons name="robot-outline" size={28} color="#F8FAFC" />
      </Pressable>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <SafeAreaView style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {view === "chat" ? (
                  <Pressable
                    onPress={() => {
                      setView("menu");
                      resetConversation();
                    }}
                    style={styles.headerButton}
                  >
                    <Ionicons name="arrow-back" size={20} color="#F8FAFC" />
                  </Pressable>
                ) : (
                  <View style={styles.robotBadge}>
                    <MaterialCommunityIcons
                      name="robot-outline"
                      size={22}
                      color="#F8FAFC"
                    />
                  </View>
                )}

                <View>
                  <Text style={styles.headerTitle}>BestGym AI</Text>
                  <Text style={styles.headerSubtitle}>
                    Tư vấn gói tập và dinh dưỡng
                  </Text>
                </View>
              </View>

              <Pressable onPress={handleClose} style={styles.headerButton}>
                <Ionicons name="close" size={20} color="#F8FAFC" />
              </Pressable>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {view === "menu" ? (
                <>
                  <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeText}>{welcomeText}</Text>
                  </View>

                  {QUICK_ACTIONS.map((item) => (
                    <Pressable
                      key={item.key}
                      onPress={() => void sendMessage(item.prompt, item.scope)}
                      style={styles.quickActionCard}
                    >
                      <View style={styles.quickActionIcon}>{item.icon}</View>
                      <View style={styles.quickActionContent}>
                        <Text style={styles.quickActionTitle}>{item.title}</Text>
                        <Text style={styles.quickActionDescription}>
                          {item.description}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </>
              ) : (
                <>
                  {!messages.length && (
                    <View style={styles.welcomeCard}>
                      <Text style={styles.welcomeText}>{welcomeText}</Text>
                    </View>
                  )}

                  {messages.map((message) => (
                    <View
                      key={message.id}
                      style={[
                        styles.messageBubble,
                        message.role === "user"
                          ? styles.userBubble
                          : styles.assistantBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          message.role === "user"
                            ? styles.userMessageText
                            : styles.assistantMessageText,
                        ]}
                      >
                        {message.text}
                      </Text>
                    </View>
                  ))}

                  {isLoading && (
                    <View style={[styles.messageBubble, styles.assistantBubble]}>
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#22C55E" />
                        <Text style={styles.assistantMessageText}>
                          BestGym AI đang suy nghĩ...
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {view === "chat" && (
              <View style={styles.inputContainer}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={1000}
                  placeholder={
                    chatScope === "nutrition"
                      ? "Hỏi tiếp về chế độ ăn, calories, macro..."
                      : "Hỏi tiếp về gói tập hoặc chương trình tập..."
                  }
                  placeholderTextColor="#64748B"
                  style={styles.input}
                  editable={!isLoading}
                />
                <Pressable
                  onPress={() => void sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  style={[
                    styles.sendButton,
                    (!input.trim() || isLoading) && styles.sendButtonDisabled,
                  ]}
                >
                  <Ionicons name="send" size={18} color="#08110A" />
                </Pressable>
              </View>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 104,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    zIndex: 50,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(2,8,23,0.64)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: "78%",
    backgroundColor: "#0B1220",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#000",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  robotBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  headerSubtitle: {
    color: "rgba(248,250,252,0.68)",
    fontSize: 12,
  },
  content: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  welcomeCard: {
    borderRadius: 18,
    backgroundColor: "#111827",
    padding: 14,
  },
  welcomeText: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
  },
  quickActionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  quickActionDescription: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
  },
  messageBubble: {
    maxWidth: "90%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#000",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#111827",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  userMessageText: {
    color: "#F8FAFC",
  },
  assistantMessageText: {
    color: "#CBD5E1",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 20 : 16,
    backgroundColor: "#0B1220",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: 18,
    backgroundColor: "#111827",
    color: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});
