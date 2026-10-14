import React from 'react';
import { Sparkles } from 'lucide-react';
import { AiTutorMascotIcon } from './AiTutorMascotIcon';

interface AiTutorHeaderProps {
  currentLevelName?: string;
}

export const AiTutorHeader: React.FC<AiTutorHeaderProps> = ({ currentLevelName }) => {
  return (
    <div className="bg-white rounded-[20px] p-6 border border-[var(--border)] shadow-[var(--shadow-sm)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[var(--brand-50)] text-[var(--brand)] flex items-center justify-center shrink-0 border border-[var(--brand-100)]">
          <AiTutorMascotIcon size={36} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-[var(--text)] flex items-center gap-2 m-0">
            AI Tutor <Sparkles className="w-5 h-5 text-[var(--xp)]" />
          </h1>
          <p className="text-[var(--text-2)] font-normal text-sm mt-1 m-0">
            Trợ lý học tiếng Anh thông minh – Giải đáp từ vựng, ngữ pháp & luyện giao tiếp
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {currentLevelName && (
          <div className="bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold text-xs md:text-sm px-3.5 py-1.5 rounded-full">
            Trình độ: {currentLevelName}
          </div>
        )}
        <div className="bg-[var(--surface-2)] px-3.5 py-1.5 rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--text-2)]">
          ✨ Powered by Gemini AI
        </div>
      </div>
    </div>
  );
};
