import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FlashCardBox } from '../../../shared/components/ui/FlashCardBox';
import { RulerProgress } from '../../../shared/components/ui/RulerProgress';
import { Stamp } from '../../../shared/components/ui/Stamp';
import { HighlighterText } from '../../../shared/components/ui/HighlighterText';
import { SkeletonBox } from '../../../shared/components/ui/SkeletonBox';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { ArrowRightOutlined, RightOutlined } from '@ant-design/icons';
import type { DeckResponse } from '../../../shared/types/lela';

interface ContinueLearningSectionProps {
  enrolledDecks: { deck: DeckResponse; enrollment: any }[];
  isLoading: boolean;
}

export const ContinueLearningSection: React.FC<ContinueLearningSectionProps> = ({
  enrolledDecks,
  isLoading,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonBox height="28px" width="200px" />
          <SkeletonBox height="20px" width="80px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonBox height="180px" />
          <SkeletonBox height="180px" />
          <SkeletonBox height="180px" />
        </div>
      </div>
    );
  }

  const displayDecks = enrolledDecks.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight flex items-center gap-2">
          <HighlighterText text="Học tiếp các bộ thẻ" highlight="Học tiếp" />
        </h2>
        {enrolledDecks.length > 0 && (
          <button
            type="button"
            onClick={() => navigate('/my-decks')}
            className="text-xs sm:text-sm font-bold text-ink hover:text-brand flex items-center gap-1 transition-colors cursor-pointer"
          >
            Tất cả ({enrolledDecks.length}) <RightOutlined className="text-xs" />
          </button>
        )}
      </div>

      {displayDecks.length === 0 ? (
        <EmptyState
          title="Chưa tham gia bộ thẻ nào"
          description="Khám phá kho từ vựng TOEIC được phân loại theo chủ đề và cấp độ để bắt đầu học."
          actionText="Khám phá bộ thẻ ngay"
          onAction={() => navigate('/decks')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayDecks.map(({ deck, enrollment }) => {
            const masteredCards = enrollment?.masteredCards || 0;
            const totalCards = deck.totalCards || 0;
            const progressPercent =
              totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
            const isCompleted = totalCards > 0 && masteredCards >= totalCards;

            return (
              <FlashCardBox
                key={deck.id}
                interactive
                onClick={() => navigate(`/study/${deck.id}`)}
                className="flex flex-col justify-between h-full bg-card"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-ink-mute">
                      {deck.topic?.name || 'TOEIC'}
                    </span>
                    {isCompleted ? (
                      <Stamp text="ĐÃ THÀNH THẠO" variant="mint" />
                    ) : (
                      <Stamp text="ĐANG HỌC" variant="neutral" />
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold font-display text-ink line-clamp-1 mb-1">
                    {deck.title}
                  </h3>
                  <p className="text-xs text-ink-soft line-clamp-2 mb-4">
                    {deck.description || 'Bộ từ vựng trọng tâm bám sát đề thi TOEIC.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-line space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-ink-soft">Tiến độ</span>
                    <span className="font-bold text-ink tabular-nums">
                      {masteredCards}/{totalCards} từ ({progressPercent}%)
                    </span>
                  </div>
                  <RulerProgress percent={progressPercent} color="brand" />

                  <div className="pt-2 flex justify-end">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand group-hover:translate-x-1 transition-transform">
                      {isCompleted ? 'Ôn lại' : 'Học tiếp'} <ArrowRightOutlined className="text-[10px]" />
                    </span>
                  </div>
                </div>
              </FlashCardBox>
            );
          })}
        </div>
      )}
    </div>
  );
};
