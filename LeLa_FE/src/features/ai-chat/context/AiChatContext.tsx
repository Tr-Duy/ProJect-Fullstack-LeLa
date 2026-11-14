import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import type { AiMessage } from '../types/ai.types';
import { aiApi } from '../api/aiApi';
import { useAuth } from '../../../shared/providers/AuthProvider';

interface AiChatContextType {
  messages: AiMessage[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  sendMessage: (text: string, displayText?: string) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  stopGeneration: () => void;
  clearMessages: () => void;
}

const STORAGE_KEY = 'lela_ai_chat_session_messages';
const AiChatContext = createContext<AiChatContextType | undefined>(undefined);

export const AiChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const key = `${STORAGE_KEY}:${user?.id ?? 'guest'}`;
  const [messages, setMessages] = useState<AiMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(key) ?? sessionStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(m => m && typeof m.content === 'string').map(m => ({
        ...m, timestamp: new Date(m.timestamp),
        status: m.role === 'ai' && (!m.status || m.status === 'pending') ? 'interrupted' : m.status ?? 'complete',
      }));
    } catch { console.warn('Không đọc được lịch sử AI Tutor đã lưu.'); return []; }
  });
  const messagesRef = useRef(messages);
  const active = useRef<{ controller: AbortController; aiId: string } | null>(null);
  const locked = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const persist = useCallback((next: AiMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
    try { sessionStorage.setItem(key, JSON.stringify(next)); }
    catch { console.warn('Không lưu được lịch sử AI Tutor trong phiên này.'); }
  }, [key]);
  useEffect(() => {
    persist(messagesRef.current);
    sessionStorage.removeItem(STORAGE_KEY); // Migrate legacy session history to a user-scoped key.
  }, [persist]);

  const run = useCallback(async (text: string, displayText?: string, previous?: AiMessage) => {
    if (locked.current || !text.trim()) return;
    locked.current = true; // Synchronous: Enter and submit in the same render cannot create two turns.
    const userId = previous?.id ?? crypto.randomUUID();
    const aiId = `${userId}:ai`;
    const previousAi = messagesRef.current.find(m => m.id === aiId);
    const clientMessageId = previousAi?.status === 'complete' ? crypto.randomUUID()
      : previous?.clientMessageId ?? userId;
    const userMessage: AiMessage = { id: userId, role: 'user', content: displayText ?? text,
      requestText: text, clientMessageId, timestamp: previous?.timestamp ?? new Date(), status: 'complete' };
    const aiMessage: AiMessage = { id: aiId, role: 'ai', content: '', timestamp: new Date(), status: 'pending' };
    const cutoff = previous ? messagesRef.current.findIndex(m => m.id === userId) : messagesRef.current.length;
    const before = messagesRef.current.slice(0, cutoff);
    const history: { role: 'user' | 'model'; text: string }[] = [];
    for (let i = 0; i < before.length - 1; i++) {
      if (before[i].role === 'user' && before[i + 1].role === 'ai' && before[i + 1].status === 'complete') {
        history.push({ role: 'user', text: before[i].requestText ?? before[i].content },
          { role: 'model', text: before[i + 1].content });
      }
    }
    persist([...before, userMessage, aiMessage]);
    const controller = new AbortController();
    active.current = { controller, aiId };
    setIsGenerating(true); setError(null);
    try {
      const result = await aiApi.chat({ message: text, clientMessageId,
        history: history.slice(-12).map(item => ({ ...item, text: item.text.slice(0, 16000) })) }, controller.signal);
      if (active.current?.controller !== controller) return;
      const complete = result.complete && result.finishReason === 'STOP';
      persist(messagesRef.current.map(m => m.id === aiId ? { ...m, content: result.content,
        status: complete ? 'complete' : result.content ? 'incomplete' : 'error', finishReason: result.finishReason,
        model: result.model, usageMetadata: result.usageMetadata } : m));
      if (!complete) {
        setError(result.content ? 'Câu trả lời chưa hoàn chỉnh. Bạn có thể bấm Thử lại để nhận câu trả lời đầy đủ.'
          : `AI đang quá tải, bạn thử lại sau ít phút. (Mã: ${result.errorCode ?? 'AI_BUSY'}; ${result.requestId})`);
      }
    } catch (failure) {
      if (active.current?.controller !== controller) return;
      const cancelled = axios.isCancel(failure) || controller.signal.aborted;
      persist(messagesRef.current.map(m => m.id === aiId ? { ...m, status: cancelled ? 'interrupted' : 'error' } : m));
      if (!cancelled) setError(!localStorage.getItem('accessToken') || (axios.isAxiosError(failure) && failure.response?.status === 401)
        ? 'Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại để tiếp tục trò chuyện nhé.'
        : axios.isAxiosError(failure) && failure.code === 'ECONNABORTED'
          ? 'AI phản hồi quá lâu. Bạn bấm Thử lại sau ít phút nhé. (Mã: AI_TIMEOUT)'
          : 'Không thể nhận phản hồi từ AI. Bạn thử lại sau ít phút nhé. (Mã: AI_CONNECTION)');
    } finally {
      if (active.current?.controller === controller) {
        active.current = null; locked.current = false; setIsGenerating(false);
      }
    }
  }, [persist]);

  const stopGeneration = useCallback(() => {
    const current = active.current;
    if (current) {
      active.current = null; current.controller.abort();
      persist(messagesRef.current.map(m => m.id === current.aiId ? { ...m, status: 'interrupted' } : m));
    }
    locked.current = false; setIsGenerating(false);
  }, [persist]);
  useEffect(() => () => {
    const current = active.current;
    active.current = null;
    locked.current = false;
    current?.controller.abort();
  }, []);
  const sendMessage = useCallback((text: string, displayText?: string) => run(text, displayText), [run]);
  const retryLastMessage = useCallback(async () => {
    const previous = [...messagesRef.current].reverse().find(m => m.role === 'user');
    if (previous) await run(previous.requestText ?? previous.content, previous.content, previous);
  }, [run]);
  const clearMessages = useCallback(() => { stopGeneration(); persist([]); setError(null); }, [persist, stopGeneration]);
  return <AiChatContext.Provider value={{ messages, isLoading: isGenerating, isGenerating, error,
    sendMessage, retryLastMessage, stopGeneration, clearMessages }}>{children}</AiChatContext.Provider>;
};

export const useAiChatContext = () => {
  const context = useContext(AiChatContext);
  if (!context) throw new Error('useAiChatContext must be used within an AiChatProvider');
  return context;
};
