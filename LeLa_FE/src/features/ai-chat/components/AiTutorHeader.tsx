import React from 'react';
import { Sparkles } from 'lucide-react';
import { AiTutorMascotIcon } from './AiTutorMascotIcon';

interface AiTutorHeaderProps {
  currentLevelName?: string;
}

export const AiTutorHeader: React.FC<AiTutorHeaderProps> = ({ currentLevelName }) => {
  return (
    <div className="bg-[#1D2A3A] text-white rounded-2xl p-6 border-[3px] border-black shadow-[4px_4px_0px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#FFD700] border-[2px] border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000]">
          <AiTutorMascotIcon size={38} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2 m-0">
            🤖 AI Tutor <Sparkles className="w-6 h-6 text-[#FFD700]" />
          </h1>
          <p className="text-gray-300 font-medium text-sm mt-1 m-0">
            Trợ lý học tiếng Anh thông minh – Giải đáp từ vựng, ngữ pháp & luyện giao tiếp
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {currentLevelName && (
          <div className="bg-[#FFD700] text-black font-black text-xs md:text-sm px-3.5 py-1.5 rounded-full border-[2px] border-black shadow-[2px_2px_0px_0px_#000]">
            Trình độ: {currentLevelName}
          </div>
        )}
        <div className="bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold text-gray-200">
          ✨ Powered by Gemini AI
        </div>
      </div>
    </div>
  );
};
