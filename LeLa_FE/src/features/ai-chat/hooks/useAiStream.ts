import { useState, useCallback, useRef } from 'react';
import type { AiMessage } from '../types/ai.types';
import { aiApi } from '../api/aiApi';

export const useAiStream = () => {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

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
        setError(err instanceof Error ? err.message : 'Lỗi kết nối AI. Vui lòng thử lại.');
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

  return {
    messages,
    isLoading,
    isGenerating,
    error,
    sendMessage,
    stopGeneration,
    setMessages
  };
};
