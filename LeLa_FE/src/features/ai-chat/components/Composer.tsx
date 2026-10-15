import React, { useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import { ModeChips } from './ModeChips';
import type { AiMode } from './AiTutorNavigationTabs';

interface ComposerProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  activeMode: AiMode;
  onModeChange: (mode: AiMode) => void;
  isGenerating: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

const PLACEHOLDERS: Record<string, string> = {
  chat: 'Hỏi AI Tutor bất cứ điều gì về tiếng Anh...',
  translation: 'Nhập câu hoặc đoạn văn cần dịch sang tiếng Anh / tiếng Việt...',
  vocabulary: 'Nhập từ tiếng Anh cần phân tích chi tiết (ví dụ: resilient, comprehensive)...',
  sentence: 'Dán câu tiếng Anh cần kiểm tra và sửa lỗi (ví dụ: I have went to school)...',
  grammar: 'Nhập chủ đề ngữ pháp hoặc cấu trúc (ví dụ: Phân biệt Although và Despite)...',
  conversation: 'Nhập chủ đề bạn muốn luyện hội thoại...',
  support: 'Mô tả vấn đề bạn cần hỗ trợ...',
};

export const Composer: React.FC<ComposerProps> = ({
  inputValue,
  setInputValue,
  activeMode,
  onModeChange,
  isGenerating,
  onSend,
  onStop,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea between 1 and 4 lines
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 48), 128)}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isGenerating) {
      onStop();
      return;
    }
    if (inputValue.trim()) {
      onSend(inputValue.trim());
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '48px';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const placeholder = PLACEHOLDERS[activeMode] || PLACEHOLDERS.chat;

  return (
    <footer className="shrink-0 bg-white border-t border-[var(--border)] px-4 pt-2.5 pb-3 sm:px-5 sm:pb-3.5 space-y-2">
      {/* Mode Switcher Chips */}
      <ModeChips activeMode={activeMode} onModeChange={onModeChange} />

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
        <label htmlFor="ai-tutor-input" className="sr-only">
          Nội dung gửi cho AI Tutor
        </label>
        <div className="relative flex-1 min-w-0">
          <textarea
            id="ai-tutor-input"
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-4 pr-3 py-3 rounded-[16px] border border-[var(--border)] bg-[#FFFDF9] text-[14px] leading-relaxed text-[var(--text)] placeholder:text-[var(--text-3)] focus:border-[var(--brand)] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.2)] focus:outline-none resize-none transition-all duration-150 min-h-[48px] max-h-[128px]"
          />
        </div>

        {/* Action Button: Send or Stop */}
        <div className="shrink-0 pb-0.5">
          {isGenerating ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Dừng tạo câu trả lời"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-all shadow-sm active:scale-95"
              title="Dừng phản hồi"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputValue.trim()}
              aria-label="Gửi tin nhắn"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--brand)] hover:bg-[var(--brand-600)] text-[#2A1300] transition-all shadow-sm disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-[var(--brand)] active:scale-95"
              title="Gửi câu hỏi"
            >
              <Send className="w-4 h-4 translate-x-0.5" />
            </button>
          )}
        </div>
      </form>

      {/* Bottom Disclaimer & Hint */}
      <div className="flex items-center justify-between text-[11px] sm:text-[12px] text-[var(--text-3)] px-1">
        <span className="truncate">
          AI có thể trả lời chưa chính xác. Hãy kiểm tra lại thông tin quan trọng.
        </span>
        <span className="hidden sm:inline shrink-0 pl-2 opacity-70">
          Enter để gửi · Shift+Enter xuống dòng
        </span>
      </div>
    </footer>
  );
};
