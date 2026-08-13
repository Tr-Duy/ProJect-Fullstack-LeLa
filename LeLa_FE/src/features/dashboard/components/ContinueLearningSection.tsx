import React from 'react';
import { Button, Card, Empty, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { RightOutlined } from '@ant-design/icons';
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
      <div className="brutal-card brutal-shadow bg-white p-6 md:p-8 mb-8 border-[3px] border-black">
        <h2 className="text-2xl font-black uppercase mb-6 border-b-[3px] border-black pb-3 text-[#1D2A3A]">
          BỘ THẺ ĐANG HỌC
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="brutal-card">
              <Skeleton active />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Take top 3 decks
  const displayDecks = enrolledDecks.slice(0, 3);

  return (
    <div className="brutal-card brutal-shadow bg-white p-6 md:p-8 mb-8 border-[3px] border-black">
      <div className="flex justify-between items-center mb-6 border-b-[3px] border-black pb-3">
        <h2 className="text-2xl font-black uppercase text-[#1D2A3A] m-0">
          BỘ THẺ ĐANG HỌC
        </h2>
        {enrolledDecks.length > 0 && (
          <Button
            type="link"
            className="font-bold text-[#F05A4A] hover:text-[#d94f41] p-0 text-base flex items-center gap-1"
            onClick={() => navigate('/my-decks')}
          >
            XEM TẤT CẢ ({enrolledDecks.length}) <RightOutlined />
          </Button>
        )}
      </div>

      {displayDecks.length === 0 ? (
        <div className="py-8 text-center bg-[#F4F3EE] border-[2px] border-black p-6">
          <Empty
            description={
              <span className="font-bold text-gray-600 text-lg">
                Bạn chưa tham gia học bộ thẻ nào.
              </span>
            }
          />
          <Button
            className="mt-4 brutal-pill border-black font-black uppercase text-white bg-[#F05A4A] hover:!bg-[#d94f41] h-12 px-8 text-base shadow-[2px_2px_0px_0px_#000]"
            onClick={() => navigate('/decks')}
          >
            KHÁM PHÁ BỘ THẺ MỚI
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayDecks.map(({ deck, enrollment }) => {
            const masteredCards = enrollment?.masteredCards || 0;
            const totalCards = deck.totalCards || 0;
            const progressPercent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

            return (
              <div
                key={deck.id}
                className="brutal-card brutal-shadow bg-white border-[2px] border-black flex flex-col justify-between p-5 hover:-translate-y-1 transition-transform"
              >
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="bg-[#2A8B9D] text-white text-xs font-bold px-2.5 py-1 brutal-border border-black">
                      {deck.topic?.name || 'Chủ đề'}
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      {totalCards} thẻ
                    </span>
                  </div>

                  <h3
                    className="text-xl font-black text-[#1D2A3A] mb-3 line-clamp-1 cursor-pointer hover:text-[#F05A4A] transition-colors"
                    onClick={() => navigate(`/decks/${deck.id}`)}
                  >
                    {deck.title}
                  </h3>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1 uppercase">
                      <span>Tiến độ</span>
                      <span>{masteredCards} / {totalCards} thẻ ({progressPercent}%)</span>
                    </div>
                    <div className="h-3 w-full bg-[#F4F3EE] border-[2px] border-black overflow-hidden relative">
                      <div
                        className="h-full bg-[#2A8B9D] transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full brutal-pill font-black uppercase h-11 !bg-[#1D2A3A] !text-white hover:!bg-[#2A8B9D] border-[2px] border-black"
                  onClick={() => navigate(`/study/${deck.id}`)}
                >
                  HỌC TIẾP
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
