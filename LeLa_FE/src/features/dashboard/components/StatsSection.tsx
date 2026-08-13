import React from 'react';

interface StatsSectionProps {
  streak: number;
  xp: number;
  totalXp: number;
  totalCardsLearned: number;
  masteredPercent: number;
}

export const StatsSection: React.FC<StatsSectionProps> = ({
  streak,
  xp,
  totalXp,
  totalCardsLearned,
  masteredPercent,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      {/* Streak Card */}
      <div className="brutal-card brutal-shadow bg-[#FFD700] p-6 flex flex-col justify-between border-[3px] border-black">
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-black">
          🔥 Chuỗi ngày học
        </span>
        <div className="text-4xl md:text-5xl font-black text-black my-2">
          {streak} ngày
        </div>
        <span className="text-xs font-bold text-black opacity-80">
          {streak > 0 ? 'Giữ vững phong độ mỗi ngày! 🔥' : 'Học hôm nay để bắt đầu chuỗi! 🔥'}
        </span>
      </div>

      {/* XP Card */}
      <div className="brutal-card brutal-shadow bg-[#70C2D1] p-6 flex flex-col justify-between border-[3px] border-black">
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-black">
          ⚡ Kinh nghiệm (XP)
        </span>
        <div className="text-4xl md:text-5xl font-black text-black my-2">
          +{xp} XP
        </div>
        <span className="text-xs font-bold text-black opacity-80">
          Tổng tích lũy: {totalXp} XP
        </span>
      </div>

      {/* Mastery Card */}
      <div className="brutal-card brutal-shadow bg-[#F05A4A] p-6 flex flex-col justify-between text-white border-[3px] border-black">
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider">
          🎴 Thẻ thành thạo
        </span>
        <div className="text-4xl md:text-5xl font-black my-2">
          {totalCardsLearned}
        </div>
        <span className="text-xs font-bold opacity-90">
          Tỷ lệ thành thạo: {masteredPercent}%
        </span>
      </div>
    </div>
  );
};
