import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowDown, AlertCircle, RotateCcw } from 'lucide-react';
import type { AiMessage } from '../types/ai.types';
import { MessageBubble } from './MessageBubble';
import { EmptyState } from './EmptyState';
import type { AiMode } from './AiTutorNavigationTabs';

interface MessageListProps {
  className?: string;
  messages: AiMessage[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  onRegenerate: () => void;
  onSelectSuggestion: (text: string, mode: AiMode) => void;
  suggestedDeck?: { title: string; word?: string };
}

export const MessageList: React.FC<MessageListProps> = ({
  className = '',
  messages,
  isLoading,
  isGenerating,
  error,
  onRegenerate,
  onSelectSuggestion,
  suggestedDeck,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const isNear = distanceToBottom <= 120;
    isNearBottomRef.current = isNear;
    setShowScrollBottom(!isNear && messages.length > 0);
  };

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(false);
    }
  }, [messages, isLoading, isGenerating, scrollToBottom]);

  return (
    <div className={`relative flex-1 min-h-0 bg-white ${className}`}>
      {/* Scrollable message log area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-atomic="false"
        className="h-full overflow-y-auto p-4 sm:p-6"
      >
        <div className="max-w-[760px] mx-auto min-h-full flex flex-col justify-between">
          {messages.length === 0 ? (
            <EmptyState
              onSelectSuggestion={onSelectSuggestion}
              suggestedDeck={suggestedDeck}
            />
          ) : (
            <div className="flex flex-col flex-1">
              {messages.map((msg, index) => {
                const isLastAiMessage =
                  msg.role === 'ai' &&
                  index === messages.length - 1 &&
                  (isLoading || isGenerating);

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isStreaming={isLastAiMessage}
                    onRegenerate={
                      msg.role === 'ai' && index === messages.length - 1 && !isGenerating
                        ? onRegenerate
                        : undefined
                    }
                  />
                );
              })}

              {/* Error banner with retry */}
              {error && (
                <div className="my-3 mx-auto max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-[13px] text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{error}</p>
                    <button
                      type="button"
                      onClick={onRegenerate}
                      className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-red-800 hover:text-red-950 underline"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Thử lại câu hỏi vừa rồi</span>
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-1 shrink-0" />
            </div>
          )}
        </div>
      </div>

      {/* Floating "Xuống cuối" pill button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-3 right-4 sm:right-6 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[12px] font-semibold text-[var(--text)] border border-[var(--border)] shadow-[var(--shadow-md)] hover:border-[var(--brand)] hover:text-[var(--brand-700)] transition-all active:scale-95 animate-fadeIn"
          aria-label="Cuộn xuống tin nhắn mới nhất"
        >
          <ArrowDown className="w-3.5 h-3.5 text-[var(--brand)]" />
          <span>Xuống cuối</span>
        </button>
      )}
    </div>
  );
};
