import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

import type { DeckResponse } from '../../../shared/types/lela';

interface DashboardHeroProps {
  username?: string;
  levelName?: string;
  dueTodayCount?: number;
  continueDeck?: { deck: DeckResponse; masteredCards: number } | null;
  hasCurrentLevel: boolean;
  allCompleted?: boolean;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  username = 'bạn',
  levelName,
  dueTodayCount = 0,
  continueDeck,
  hasCurrentLevel,
  allCompleted = false,
}) => {
  const navigate = useNavigate();

  // Determine priority CTA
  let ctaTitle = 'Sẵn sàng học tiếng Anh hôm nay?';
  let ctaSubtitle = 'Hãy bắt đầu bằng việc ôn tập thẻ hoặc khám phá bài học mới.';
  let ctaButtonText = 'KHÁM PHÁ BÀI HỌC MỚI';
  let ctaAction = () => navigate('/decks');

  if (dueTodayCount > 0) {
    ctaTitle = `Bạn có ${dueTodayCount} thẻ cần ôn tập hôm nay`;
    ctaSubtitle = 'Dành 5-10 phút để giữ vững ký ức từ vựng qua phương pháp SRS.';
    ctaButtonText = '▶ ÔN TẬP NGAY';
    ctaAction = () => navigate('/my-decks');
  } else if (continueDeck && (continueDeck.deck.totalCards === 0 || continueDeck.masteredCards < continueDeck.deck.totalCards)) {
    const progressPercent = continueDeck.deck.totalCards > 0
      ? Math.round((continueDeck.masteredCards / continueDeck.deck.totalCards) * 100)
      : 0;
    ctaTitle = `Tiếp tục học: ${continueDeck.deck.title}`;
    ctaSubtitle = `Đã học ${continueDeck.masteredCards} / ${continueDeck.deck.totalCards} thẻ (${progressPercent}%)`;
    ctaButtonText = '▶ TIẾP TỤC HỌC';
    ctaAction = () => navigate(`/study/${continueDeck.deck.id}`);
  } else if (allCompleted) {
    ctaTitle = '🎉 Bạn đã hoàn thành tất cả bộ thẻ!';
    ctaSubtitle = 'Tuyệt vời! Hãy ôn tập lại các bộ thẻ cũ hoặc khám phá bài học mới ở trình độ tiếp theo.';
    ctaButtonText = 'KHÁM PHÁ BÀI HỌC MỚI';
    ctaAction = () => navigate('/decks');
  } else if (!hasCurrentLevel) {
    ctaTitle = 'Chào mừng bạn đến với LeLa!';
    ctaSubtitle = 'Hãy chọn hoặc kiểm tra trình độ TOEIC đầu vào để nhận lộ trình phù hợp.';
    ctaButtonText = 'XÁC ĐỊNH TRÌNH ĐỘ NGAY';
    ctaAction = () => navigate('/placement-tests');
  }

  return (
    <div className="rounded-[var(--radius-card)] shadow-[var(--shadow-md)] bg-gradient-to-r from-[#2B1B0E] to-[#2A8B9D] text-white p-6 md:p-10 mb-8 border border-[var(--border)] relative overflow-hidden">
      {/* Decorative Blur Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#F05A4A] rounded-full translate-x-20 -translate-y-20 blur-3xl opacity-30 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl md:text-3xl font-black">👋 Chào {username}!</span>
            {levelName && (
              <span className="bg-[#FFD700] text-black font-black text-xs md:text-sm px-3 py-1 border border-[var(--border)] border-[var(--border)] shadow-[var(--shadow-sm)]">
                {levelName}
              </span>
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-white/95 leading-snug">
            {ctaTitle}
          </h2>
          <p className="text-white/80 font-medium text-sm md:text-base">
            {ctaSubtitle}
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="shrink-0 w-full md:w-auto">
          <Button
            onClick={ctaAction}
            className="w-full md:w-auto h-14 px-8 brutal-pill !bg-[#F05A4A] hover:!bg-[#d94f41] !text-white font-black text-lg md:text-xl border border-[var(--border)] shadow-[var(--shadow-sm)] hover:-translate-y-1 transition-transform flex items-center justify-center gap-2"
          >
            {ctaButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
};
