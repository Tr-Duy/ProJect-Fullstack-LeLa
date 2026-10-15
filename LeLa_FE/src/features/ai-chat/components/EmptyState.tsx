import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, PenLine, Languages, MessageSquare, Sparkles } from 'lucide-react';
import { Lela } from '../../../shared/components/ui/Lela';
import type { AiMode } from './AiTutorNavigationTabs';

interface EmptyStateProps {
  onSelectSuggestion: (text: string, mode: AiMode) => void;
  suggestedDeck?: { title: string; word?: string };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectSuggestion,
  suggestedDeck,
}) => {
  const suggestions = [
    {
      icon: BookOpen,
      title: 'Giải thích một từ vựng',
      subtitle: 'ví dụ: resilient, meticulous',
      text: 'resilient',
      mode: 'vocabulary' as AiMode,
    },
    {
      icon: PenLine,
      title: 'Sửa câu tiếng Anh',
      subtitle: 'ví dụ: I have went to school',
      text: 'I have went to school yesterday.',
      mode: 'sentence' as AiMode,
    },
    {
      icon: Languages,
      title: 'Dịch sang tiếng Anh',
      subtitle: 'ví dụ: Tôi muốn dời lịch họp...',
      text: 'Tôi muốn dời cuộc họp sang 3 giờ chiều mai.',
      mode: 'translation' as AiMode,
    },
    {
      icon: MessageSquare,
      title: 'Luyện ngữ pháp',
      subtitle: 'ví dụ: Phân biệt Although và Despite',
      text: 'Phân biệt Although, Even though và In spite of',
      mode: 'grammar' as AiMode,
    },
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 max-w-[700px] mx-auto select-none">
      {/* Lela Mascot */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="mb-3"
      >
        <Lela mood="happy" size={72} />
      </motion.div>

      {/* Title & Subtitle */}
      <motion.h2
        initial={{ y: 6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.08, duration: 0.2 }}
        className="font-heading font-semibold text-[20px] sm:text-[22px] text-[var(--text)] tracking-tight mb-1"
      >
        Hôm nay bạn muốn học gì?
      </motion.h2>

      <motion.p
        initial={{ y: 6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.2 }}
        className="text-[13px] sm:text-[14px] text-[var(--text-2)] mb-5 max-w-md leading-relaxed"
      >
        Hỏi mình về từ vựng, ngữ pháp hoặc nhờ sửa câu tiếng Anh nhé.
      </motion.p>

      {/* Suggestion Grid 2x2 */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-left">
        {suggestions.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.title}
              type="button"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + index * 0.05, duration: 0.2 }}
              onClick={() => onSelectSuggestion(item.text, item.mode)}
              className="flex items-center gap-3 p-3 h-16 rounded-[14px] border border-[var(--border)] bg-white hover:border-[var(--brand)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 active:translate-y-0 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] flex items-center justify-center shrink-0 group-hover:bg-[var(--brand)] group-hover:text-[#2A1300] transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-[var(--text)] group-hover:text-[var(--brand-700)] transition-colors truncate">
                  {item.title}
                </div>
                <div className="text-[11px] text-[var(--text-3)] truncate">
                  {item.subtitle}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Dynamic suggestion card if deck data exists */}
      {suggestedDeck?.title && (
        <motion.button
          type="button"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.38, duration: 0.2 }}
          onClick={() =>
            onSelectSuggestion(
              suggestedDeck.word
                ? suggestedDeck.word
                : `Giải thích các từ khó trong bộ ${suggestedDeck.title}`,
              suggestedDeck.word ? 'vocabulary' : 'chat'
            )
          }
          className="mt-3 w-full flex items-center gap-3 p-3 h-14 rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)]/60 hover:border-[var(--brand)] hover:bg-[var(--surface-2)] transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold text-[var(--text)] truncate">
              {suggestedDeck.word
                ? `Giải thích từ "${suggestedDeck.word}" trong bộ ${suggestedDeck.title}`
                : `Giải thích các từ khó trong bộ "${suggestedDeck.title}"`}
            </div>
            <div className="text-[11px] text-[var(--brand-700)] truncate">
              Gợi ý từ tiến độ học hiện tại của bạn
            </div>
          </div>
        </motion.button>
      )}
    </div>
  );
};
