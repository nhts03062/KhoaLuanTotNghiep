'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeftOutlined,
  CloseOutlined,
  CoffeeOutlined,
  MessageOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Input, Spin, message } from 'antd';

import { recommendNutrition, recommendProgram } from '../services/api';
import { useAuthStore } from '../stores/authStore';

type View = 'menu' | 'chat';
type ChatScope = 'packages' | 'nutrition';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

const QUICK_ACTIONS = [
  {
    key: 'workout',
    title: 'Gợi ý gói tập',
    description: 'Gợi ý gói tập phù hợp với mục tiêu hiện tại',
    icon: <ThunderboltOutlined className="text-primary" />,
    prompt:
      'Hãy gợi ý cho tôi gói tập hoặc chương trình tập phù hợp dựa trên hồ sơ hiện tại của tôi. Nếu thiếu dữ liệu quan trọng thì hãy hỏi lại thật ngắn gọn trước khi kết luận. Chỉ đề xuất tối đa 3 lựa chọn và nêu lý do.',
  },
  {
    key: 'diet',
    title: 'Gợi ý chế độ ăn',
    description: 'Đưa ra thực đơn và macro phù hợp với mục tiêu',
    icon: <CoffeeOutlined className="text-primary" />,
    prompt:
      'Hãy gợi ý chế độ ăn phù hợp với hồ sơ hiện tại của tôi để hỗ trợ mục tiêu sức khỏe hoặc thể hình. Nếu đủ dữ liệu thì ước tính calories và macro; nếu thiếu dữ liệu quan trọng thì hỏi lại thật ngắn gọn trước khi kết luận.',
  },
] as const;

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const maybeError = error as {
      message?: unknown;
      error?: unknown;
      statusCode?: number;
    };

    if (Array.isArray(maybeError.message)) {
      return maybeError.message.join(', ');
    }
    if (typeof maybeError.message === 'string') {
      return maybeError.message;
    }
    if (typeof maybeError.error === 'string') {
      return maybeError.error;
    }
  }

  return 'Không thể lấy phản hồi từ trợ lý AI.';
}

export default function ChatBot() {
  const { isLoggedIn } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>('menu');
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState(() => createId());
  const [chatScope, setChatScope] = useState<ChatScope>('packages');

  const welcomeText = useMemo(
    () =>
      isLoggedIn
        ? 'Xin chào! Tôi có thể gợi ý gói tập hoặc chế độ ăn dựa trên hồ sơ của bạn.'
        : 'Bạn cần đăng nhập để sử dụng BestGym AI vì endpoint hiện tại yêu cầu tài khoản.',
    [isLoggedIn],
  );

  const resetConversation = () => {
    setMessages([]);
    setInput('');
    setConversationId(createId());
    setChatScope('packages');
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setView('menu');
      resetConversation();
    }, 200);
  };

  const sendMessage = async (content: string, scope?: ChatScope) => {
    const text = content.trim();
    if (!text) return;

    if (!isLoggedIn) {
      message.warning('Vui lòng đăng nhập để sử dụng bot tư vấn.');
      return;
    }

    const currentScope = scope ?? chatScope;
    if (scope) {
      setChatScope(scope);
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      text,
    };

    setView('chat');
    setInput('');
    setIsLoading(true);
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res =
        currentScope === 'nutrition'
          ? await recommendNutrition({
              conversationId,
              userMessage: text,
            })
          : await recommendProgram({
              conversationId,
              userMessage: text,
            });

      if (res?.statusCode && res.statusCode >= 400) {
        throw res;
      }

      const aiText = res?.data?.text;
      if (!aiText || typeof aiText !== 'string') {
        throw new Error('AI chưa trả về nội dung hợp lệ.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          text: aiText,
        },
      ]);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      message.error(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          text: `Xin lỗi, tôi chưa thể phản hồi lúc này. ${errorMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            handleClose();
            return;
          }
          setIsOpen(true);
        }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform hover:scale-105"
      >
        {isOpen ? <CloseOutlined /> : <MessageOutlined />}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
          >
            <div className="flex items-center gap-3 bg-black px-4 py-3 text-white">
              {view !== 'menu' ? (
                <button
                  type="button"
                  onClick={() => {
                    setView('menu');
                    resetConversation();
                  }}
                  className="transition-opacity hover:opacity-80"
                >
                  <ArrowLeftOutlined />
                </button>
              ) : null}

              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <RobotOutlined />
                </div>
                <div>
                  <p className="text-sm font-semibold">BestGym AI</p>
                  <p className="text-xs text-white/70">Tư vấn gói tập và dinh dưỡng</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-neutral-50 p-4">
              <AnimatePresence mode="wait">
                {view === 'menu' ? (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-3"
                  >
                    <div className="rounded-xl bg-white p-3 text-sm text-neutral-700 shadow-sm">
                      {welcomeText}
                    </div>

                    {QUICK_ACTIONS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          sendMessage(
                            item.prompt,
                            item.key === 'diet' ? 'nutrition' : 'packages',
                          )
                        }
                        className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-left transition hover:border-black hover:shadow-sm"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-lg">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {item.title}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    className="flex flex-col gap-3"
                  >
                    {messages.length === 0 ? (
                      <div className="rounded-xl bg-white p-3 text-sm text-neutral-700 shadow-sm">
                        {welcomeText}
                      </div>
                    ) : null}

                    {messages.map((item) => (
                      <div
                        key={item.id}
                        className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                          item.role === 'user'
                            ? 'ml-auto bg-black text-white'
                            : 'bg-white text-neutral-800 shadow-sm'
                        }`}
                      >
                        {item.text}
                      </div>
                    ))}

                    {isLoading ? (
                      <div className="flex max-w-[90%] items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
                        <Spin size="small" />
                        <span>BestGym AI đang suy nghĩ...</span>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {view === 'chat' ? (
              <div className="border-t border-neutral-200 bg-white p-3">
                <div className="flex items-end gap-2">
                  <Input.TextArea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onPressEnter={(e) => {
                      e.preventDefault();
                      if (!e.shiftKey && !isLoading) {
                        void sendMessage(input);
                      }
                    }}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    placeholder={
                      chatScope === 'nutrition'
                        ? 'Hỏi tiếp về chế độ ăn, calories, macro...'
                        : 'Hỏi tiếp về gói tập hoặc chương trình tập...'
                    }
                    disabled={isLoading || !isLoggedIn}
                  />
                  <Button
                    type="primary"
                    className="bg-black!"
                    icon={<SendOutlined />}
                    disabled={!input.trim() || isLoading || !isLoggedIn}
                    onClick={() => void sendMessage(input)}
                  />
                </div>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
