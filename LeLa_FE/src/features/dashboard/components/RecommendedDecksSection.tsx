import React from 'react';
import { Button, Card, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { RightOutlined } from '@ant-design/icons';
import type { DeckResponse } from '../../../shared/types/lela';

interface RecommendedDecksSectionProps {
  levelName?: string;
  recommendedDecks: DeckResponse[];
  isLoading: boolean;
}

export const RecommendedDecksSection: React.FC<RecommendedDecksSectionProps> = ({
  levelName = 'bạn',
  recommendedDecks,
  isLoading,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-card)] shadow-[var(--shadow-md)] bg-white p-6 md:p-8 mb-8 border border-[var(--border)]">
        <h2 className="text-2xl font-black  mb-6 border-b-[3px] border-[var(--border)] pb-3 text-[#2B1B0E]">
          ĐỀ XUẤT DÀNH CHO BẠN
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-[var(--radius-card)]">
              <Skeleton active />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const displayDecks = recommendedDecks.slice(0, 3);

  if (displayDecks.length === 0) {
    return null; // Don't render if no new recommended decks available
  }

  return (
    <div className="rounded-[var(--radius-card)] shadow-[var(--shadow-md)] bg-white p-6 md:p-8 mb-8 border border-[var(--border)]">
      <div className="flex justify-between items-center mb-6 border-b-[3px] border-[var(--border)] pb-3">
        <h2 className="text-2xl font-black  text-[#2B1B0E] m-0">
          ĐỀ XUẤT CHO TRÌNH ĐỘ ({levelName})
        </h2>
        <Button
          type="link"
          className="font-bold text-[#2A8B9D] hover:text-[#2B1B0E] p-0 text-base flex items-center gap-1"
          onClick={() => navigate('/decks')}
        >
          KHÁM PHÁ THÊM <RightOutlined />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayDecks.map((deck) => (
          <div
            key={deck.id}
            className="rounded-[var(--radius-card)] shadow-[var(--shadow-md)] bg-[#F4F3EE] border border-[var(--border)] flex flex-col justify-between p-5 hover:-translate-y-1 transition-transform"
          >
            <div>
              <div className="flex justify-between items-start mb-2 gap-2">
                <span className="bg-[#FFD700] text-black text-xs font-bold px-2.5 py-1 border border-[var(--border)] border-[var(--border)]">
                  {deck.topic?.name || 'Chủ đề mới'}
                </span>
                <span className="text-xs font-bold text-gray-600">
                  {deck.totalCards || 0} thẻ
                </span>
              </div>

              <h3
                className="text-xl font-black text-[#2B1B0E] mb-2 line-clamp-1 cursor-pointer hover:text-[#F05A4A] transition-colors"
                onClick={() => navigate(`/decks/${deck.id}`)}
              >
                {deck.title}
              </h3>

              <p className="text-gray-600 font-medium text-sm line-clamp-2 mb-4">
                {deck.description || 'Bộ thẻ phù hợp với trình độ học của bạn.'}
              </p>
            </div>

            <Button
              className="w-full brutal-pill font-bold h-11 bg-white text-[#2B1B0E] hover:!bg-[#2A8B9D] hover:!text-white border border-[var(--border)] shadow-[var(--shadow-sm)]"
              onClick={() => navigate(`/decks/${deck.id}`)}
            >
              XEM CHI TIẾT
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
