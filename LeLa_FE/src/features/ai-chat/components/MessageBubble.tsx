import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Copy, Check, Volume2, RotateCcw } from 'lucide-react';
import type { AiMessage } from '../types/ai.types';
import { Lela } from '../../../shared/components/ui/Lela';

interface MessageBubbleProps {
  message: AiMessage;
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
  onRegenerate,
}) => {
  const isAi = message.role === 'ai';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content.replace(/[*#_`]/g, ''));
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const hasEnglishText = /[a-zA-Z]{3,}/.test(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`flex w-full mb-4 ${isAi ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`flex items-start max-w-[85%] md:max-w-[80%] gap-2.5 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        {isAi && (
          <div className="shrink-0 pt-0.5 select-none" aria-hidden="true">
            <Lela mood={isStreaming ? 'thinking' : 'happy'} size={28} />
          </div>
        )}

        {/* Bubble & Actions */}
        <div className="flex flex-col group min-w-0">
          <div
            className={`px-4 py-3 text-[14px] leading-relaxed shadow-[var(--shadow-sm)] ${
              isAi
                ? 'bg-[var(--surface-2)] text-[var(--text)] rounded-[16px] rounded-bl-[4px] border border-[var(--border)]'
                : 'bg-[var(--brand)] text-[#2A1300] font-medium rounded-[16px] rounded-br-[4px] shadow-sm'
            }`}
          >
            {isAi ? (
              <div className="prose prose-sm max-w-none text-[var(--text)] break-words [&>p]:my-1.5 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&>ul]:my-1.5 [&>ul]:pl-5 [&>ol]:my-1.5 [&>ol]:pl-5 [&>li]:my-0.5 [&>table]:w-full [&>table]:border-collapse [&>table]:my-2 [&>table_th]:border [&>table_th]:border-[var(--border)] [&>table_th]:bg-[var(--brand-50)] [&>table_th]:p-1.5 [&>table_th]:text-left [&>table_td]:border [&>table_td]:border-[var(--border)] [&>table_td]:p-1.5 [&_strong]:font-semibold [&_strong]:text-[var(--text)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-[#FFF8EE] [&_code]:text-[var(--brand-700)] [&_code]:text-[13px] [&_pre]:bg-white [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-[var(--border)]">
                {message.content ? (
                  <>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                    {isStreaming && (
                      <span
                        className="inline-block w-1.5 h-4 ml-1 bg-[var(--brand)] animate-pulse align-middle rounded-sm"
                        aria-hidden="true"
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 py-1 px-1">
                    <span className="w-2 h-2 bg-[var(--brand)] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-[var(--brand)] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-[var(--brand)] rounded-full animate-bounce" />
                    <span className="text-[12px] text-[var(--text-2)] ml-1 font-medium">LeLa đang suy nghĩ...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            )}
          </div>

          {/* Action toolbar below AI bubble */}
          {isAi && message.content && (
            <div
              className={`flex items-center gap-2 mt-1.5 px-1 transition-opacity duration-200 ${
                isStreaming ? 'opacity-0 pointer-events-none' : 'opacity-80 group-hover:opacity-100'
              }`}
            >
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors border border-transparent hover:border-[var(--border)]"
                title="Sao chép câu trả lời"
              >
                {copied ? <Check className="w-3 h-3 text-[var(--brand)]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>

              {hasEnglishText && (
                <button
                  type="button"
                  onClick={handleSpeak}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors border border-transparent hover:border-[var(--border)] ${
                    isSpeaking
                      ? 'text-[var(--brand-700)] bg-[var(--brand-50)]'
                      : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                  }`}
                  title="Nghe phát âm tiếng Anh"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{isSpeaking ? 'Đang đọc' : 'Phát âm'}</span>
                </button>
              )}

              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors border border-transparent hover:border-[var(--border)]"
                  title="Thử trả lời lại"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Thử lại</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
