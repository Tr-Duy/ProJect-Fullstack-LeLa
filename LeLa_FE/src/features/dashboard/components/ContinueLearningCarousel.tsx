import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOutlined, RightOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { TopicChip } from '../../../shared/components/ui/TopicChip';
import { SegmentedProgress } from '../../../shared/components/ui/SegmentedProgress';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { SkeletonBox } from '../../../shared/components/ui/SkeletonBox';
import { Pressable } from '../../../ui/motion/Pressable';
import type { DeckResponse } from '../../../shared/types/lela';

interface ContinueLearningCarouselProps {
  enrolledDecks: { deck: DeckResponse; enrollment: any }[];
  isLoading: boolean;
}

function getTopicSvg(topicName?: string) {
  const t = topicName?.toLowerCase() || '';
  if (t.includes('travel') || t.includes('du lịch')) {
    // Suitcase SVG
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="7" rx="3" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    );
  }
  if (t.includes('office') || t.includes('văn phòng')) {
    // Desk / Briefcase
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    );
  }
  if (t.includes('daily') || t.includes('đời sống')) {
    // House
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BE185D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  }
  if (t.includes('food') || t.includes('ẩm thực') || t.includes('nhà hàng')) {
    // Utensils / plate
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm-15 7V2M3 2v6a3 3 0 0 0 6 0V2" />
      </svg>
    );
  }
  // Default Business: Coffee cup / laptop
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B2500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}

export const ContinueLearningCarousel: React.FC<ContinueLearningCarouselProps> = ({
  enrolledDecks,
  isLoading,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonBox height={24} width={180} />
          <SkeletonBox height={16} width={80} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonBox height={260} />
          <SkeletonBox height={260} />
          <SkeletonBox height={260} />
        </div>
      </div>
    );
  }

  const displayDecks = enrolledDecks.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-xl text-[var(--text)] tracking-tight">
            Bộ thẻ đang học
          </h3>
          <p className="text-xs text-[var(--text-3)] mt-0.5">
            Duy trì tiến độ học tập hàng ngày
          </p>
        </div>

        {enrolledDecks.length > 0 && (
          <button
            type="button"
            onClick={() => navigate('/my-decks')}
            className="text-xs font-semibold text-[var(--brand-700)] hover:text-[var(--brand)] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Xem tất cả ({enrolledDecks.length})</span>
            <RightOutlined className="text-[10px]" />
          </button>
        )}
      </div>

      {displayDecks.length === 0 ? (
        <EmptyState
          title="Bạn chưa có bộ thẻ nào đang học"
          description="Khám phá kho từ vựng TOEIC được tuyển chọn theo mục tiêu điểm số để bắt đầu lộ trình."
          actionText="Khám phá bộ thẻ ngay"
          onAction={() => navigate('/decks')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayDecks.map(({ deck, enrollment }) => {
            const masteredCards = enrollment?.masteredCards || 0;
            const learningCards = enrollment?.learningCards || 0;
            const reviewCards = enrollment?.reviewCards || 0;
            const totalCards = deck.totalCards || 0;
            const newCards = Math.max(0, totalCards - (masteredCards + learningCards + reviewCards));
            const dueCount = enrollment?.dueCount || 0;

            return (
              <Pressable
                key={deck.id}
                onClick={() => navigate(`/study/${deck.id}`)}
                className="bg-[var(--surface)] rounded-[20px] p-4 border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Deck Cover Image (16:10 ratio, radius 16px) */}
                  <div className="aspect-[16/10] w-full rounded-[16px] overflow-hidden bg-[var(--surface-2)] mb-3.5 relative border border-[var(--border)]">
                    {deck.coverImageUrl ? (
                      <img
                        src={deck.coverImageUrl}
                        alt={deck.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-[var(--brand-50)] to-[var(--surface-2)]">
                        <div className="w-12 h-12 rounded-full bg-white/80 shadow-xs flex items-center justify-center mb-1.5">
                          {getTopicSvg(deck.topic?.name)}
                        </div>
                        <span className="font-display font-bold text-sm text-[var(--text)] line-clamp-1">
                          {deck.title}
                        </span>
                        <span className="text-[11px] text-[var(--text-3)]">
                          {totalCards} từ vựng
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5">
                      <TopicChip topic={deck.topic?.name} />
                    </div>

                    {dueCount > 0 && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[var(--danger)] text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                        <ClockCircleOutlined className="text-[9px]" />
                        {dueCount} đến hạn
                      </div>
                    )}
                  </div>

                  <h4 className="font-display font-bold text-base text-[var(--text)] line-clamp-1 mb-1">
                    {deck.title}
                  </h4>
                  <p className="text-xs text-[var(--text-2)] line-clamp-1 mb-3">
                    {deck.description || 'Từ vựng trọng tâm kỳ thi TOEIC.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-3)]">
                      Đã thuộc <strong className="text-[var(--brand-700)]">{masteredCards}</strong>/{totalCards} từ
                    </span>
                    <span className="font-semibold text-[var(--brand-700)] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1 text-xs">
                      Học tiếp <ArrowRightOutlined className="text-[10px]" />
                    </span>
                  </div>

                  {/* 4-part segmented progress */}
                  <SegmentedProgress
                    masteredCount={masteredCards}
                    reviewCount={reviewCards}
                    learningCount={learningCards}
                    newCount={newCards}
                    total={totalCards}
                    height={6}
                  />
                </div>
              </Pressable>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContinueLearningCarousel;
