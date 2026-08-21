import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AiMessage } from '../types/ai.types';
import { aiApi } from '../api/aiApi';

interface AiChatContextType {
  messages: AiMessage[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  stopGeneration: () => void;
  clearMessages: () => void;
}

const STORAGE_KEY = 'lela_ai_chat_session_messages';

const AiChatContext = createContext<AiChatContextType | undefined>(undefined);

export const AiChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<AiMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch (e) {
      console.warn('Failed to parse saved AI messages', e);
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to persist AI messages', e);
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (isGenerating || !text.trim()) return;

    const userMessage: AiMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: AiMessage = {
      id: aiMessageId,
      role: 'ai',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, initialAiMessage]);
    setIsLoading(true);
    setIsGenerating(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    const request = { message: text };
    let currentContent = '';

    await aiApi.streamChat(
      request,
      (chunk) => {
        setIsLoading(false);
        currentContent += chunk + '\n';
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, content: currentContent } : msg
        ));
      },
      (err) => {
        setIsLoading(false);
        setIsGenerating(false);
        setError(err instanceof Error ? err.message : 'AI Tutor đang gặp sự cố. Vui lòng thử lại.');
      },
      () => {
        setIsLoading(false);
        setIsGenerating(false);
      },
      abortControllerRef.current.signal
    );
  }, [isGenerating]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AiChatContext.Provider
      value={{
        messages,
        isLoading,
        isGenerating,
        error,
        sendMessage,
        stopGeneration,
        clearMessages
      }}
    >
      {children}
    </AiChatContext.Provider>
  );
};

export const useAiChatContext = () => {
  const context = useContext(AiChatContext);
  if (!context) {
    throw new Error('useAiChatContext must be used within an AiChatProvider');
  }
  return context;
};
