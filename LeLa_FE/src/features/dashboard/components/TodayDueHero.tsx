import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stamp } from '../../../shared/components/ui/Stamp';
import { ArrowRightOutlined, BookOutlined, ThunderboltFilled } from '@ant-design/icons';
import type { DeckResponse } from '../../../shared/types/lela';

interface TodayDueHeroProps {
  dueTodayCount: number;
  continueDeck?: { deck: DeckResponse; masteredCards: number } | null;
  username: string;
}

export const TodayDueHero: React.FC<TodayDueHeroProps> = ({
  dueTodayCount,
  continueDeck,
}) => {
  const navigate = useNavigate();

  const handleStartReview = () => {
    if (dueTodayCount > 0) {
      if (continueDeck?.deck?.id) {
        navigate(`/study/${continueDeck.deck.id}`);
      } else {
        navigate('/my-decks');
      }
    } else if (continueDeck?.deck?.id) {
      navigate(`/study/${continueDeck.deck.id}`);
    } else {
      navigate('/decks');
    }
  };

  return (
    <div className="relative bg-ink text-paper rounded-[12px] p-6 sm:p-8 border-2 border-ink shadow-[4px_4px_0_var(--ink)] flex flex-col justify-between overflow-hidden">
      {/* Background subtle graph paper pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(var(--paper) 1px, transparent 1px), radial-gradient(var(--paper) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px',
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Stamp text="SM-2 · ĐẾN HẠN" variant="sun" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-paper/60">
              LẶP LẠI NGẮT QUÃNG
            </span>
          </div>
          {dueTodayCount === 0 && (
            <span className="text-xs font-mono text-mint font-semibold">
              ✓ ĐÃ HOÀN THÀNH MỤC TIÊU ÔN
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 my-2">
          <span className="font-mono tabular-nums text-6xl sm:text-7xl lg:text-8xl font-black text-paper tracking-tighter leading-none">
            {dueTodayCount}
          </span>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-bold font-display text-paper leading-tight">
              thẻ cần ôn tập hôm nay
            </span>
            <span className="text-sm text-paper/70 font-sans mt-0.5">
              {dueTodayCount > 0
                ? 'Ôn đúng nhịp giúp củng cố phản xạ từ vựng TOEIC vào trí nhớ dài hạn.'
                : 'Tuyệt vời! Bạn không còn thẻ nào bị trễ hạn hôm nay.'}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-6 mt-4 border-t border-paper/15 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleStartReview}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[10px] bg-brand text-white font-bold text-sm sm:text-base border-2 border-paper/20 shadow-[3px_3px_0_var(--ink)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_var(--ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        >
          <ThunderboltFilled className="text-sun" />
          <span>{dueTodayCount > 0 ? 'Bắt đầu ôn ngay' : 'Ôn luyện tiếp'}</span>
          <ArrowRightOutlined className="text-xs" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/decks')}
          className="inline-flex items-center gap-2 px-5 py-3.5 rounded-[10px] bg-paper-2 text-ink font-bold text-sm sm:text-base border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:bg-paper hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
        >
          <BookOutlined />
          <span>Học thẻ mới</span>
        </button>

        {continueDeck?.deck && (
          <span className="text-xs text-paper/60 font-mono ml-auto hidden lg:inline">
            Đang học: {continueDeck.deck.title}
          </span>
        )}
      </div>
    </div>
  );
};
