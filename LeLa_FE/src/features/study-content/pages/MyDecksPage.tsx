import { useQuery } from '@tanstack/react-query';
import { Card, Button, Skeleton } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { deckEnrollmentsApi } from '../api/deck-enrollments.api';
import type { DeckResponse } from '../../../shared/types/lela';

// Mapped Component to display the Deck details for each enrollment
function EnrolledDeckCard({ deck, masteredCards }: { deck: DeckResponse, masteredCards: number }) {
  const navigate = useNavigate();

  const progressPercent = deck.totalCards > 0 ? Math.round((masteredCards / deck.totalCards) * 100) : 0;

  const isCompleted = deck.totalCards > 0 && masteredCards >= deck.totalCards;

  return (
    <div className="brutal-card brutal-shadow bg-white flex flex-col h-full overflow-hidden transition-transform duration-300 hover:-translate-y-2">
      <div
        className="h-32 bg-gray-200 border-b-[3px] border-black bg-cover bg-center relative"
        style={{ backgroundImage: `url(${deck.coverImageUrl || 'https://placehold.co/400x200/F4F3EE/1D2A3A?text=No+Image'})` }}
      >
        {isCompleted && (
          <span className="absolute top-3 left-3 bg-[#4CAF50] text-white text-xs font-black px-2.5 py-1 brutal-border border-black shadow-[2px_2px_0px_0px_#000]">
            ✓ HOÀN THÀNH
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3
            className="text-xl font-bold leading-tight line-clamp-2 cursor-pointer hover:text-[#F05A4A] transition-colors"
            onClick={() => navigate(`/decks/${deck.id}`)}
          >
            {deck.title}
          </h3>
          <Button
            icon={<InfoCircleOutlined />}
            className="brutal-pill border-[2px] border-black bg-white text-black shrink-0 hover:bg-[#F4F3EE] hover:-translate-y-1 transition-transform"
            onClick={() => navigate(`/decks/${deck.id}`)}
            title="Chi tiết bộ thẻ"
          />
        </div>

        <div className="mb-4 mt-2">
          <div className="flex justify-between text-xs font-bold text-gray-700 mb-1 uppercase">
            <span>Tiến độ</span>
            <span>{masteredCards} / {deck.totalCards} thẻ ({progressPercent}%)</span>
          </div>
          <div className="h-4 w-full bg-[#F4F3EE] border-[2px] border-black overflow-hidden relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div
              className={`h-full border-r-[2px] border-black transition-all duration-500 ${isCompleted ? 'bg-[#4CAF50]' : 'bg-[#2A8B9D]'}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          <Button
            className={`flex-1 brutal-pill font-black uppercase h-10 border-[2px] border-black ${
              isCompleted
                ? '!bg-[#2A8B9D] !text-white hover:!bg-[#1D2A3A]'
                : '!bg-[#1D2A3A] !text-white hover:!translate-y-[-2px]'
            }`}
            onClick={() => navigate(`/study/${deck.id}`)}
          >
            {isCompleted ? 'ÔN LẠI' : 'HỌC TIẾP'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MyDecksPage() {
  const navigate = useNavigate();

  // 1. Fetch all enrollments with embedded deck details (1 single fast query)
  const { data: enrollmentsResponse, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => deckEnrollmentsApi.getMyList({ size: 50 }),
  });

  const enrollments = enrollmentsResponse?.data?.content || [];
  const isReady = !isLoadingEnrollments;

  // 2. Group by level or default
  const groupedDecks = useMemo(() => {
    if (!isReady) return {};

    const groups: Record<string, { deck: any; enrollment: any }[]> = {};

    enrollments.forEach((enrollment) => {
      const deck: any = {
        id: enrollment.deckId,
        title: enrollment.deckTitle || `Bộ thẻ #${enrollment.deckId}`,
        slug: enrollment.deckSlug || `deck-${enrollment.deckId}`,
        coverImageUrl: enrollment.deckCoverImageUrl,
        totalCards: enrollment.deckTotalCards || 0,
        difficulty: enrollment.deckDifficulty || 'BEGINNER',
        levelName: enrollment.deckLevelName,
        levelCode: enrollment.deckLevelCode,
      };

      const groupName = deck.levelName || 'Bộ thẻ đã tham gia';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push({ deck, enrollment });
    });

    return groups;
  }, [enrollments, isReady]);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[#F4F3EE]">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-[#1D2A3A]">Bộ thẻ của tôi</h1>
        </div>
        <Button
          type="primary"
          onClick={() => navigate('/decks')}
          className="brutal-pill !bg-[#F05A4A] !text-white h-12 px-6 font-bold uppercase hover:!translate-y-[-2px] transition-transform"
        >
          TÌM BỘ THẺ MỚI
        </Button>
      </div>

      {!isReady ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card className="brutal-card h-[250px]"><Skeleton active /></Card>
          <Card className="brutal-card h-[250px]"><Skeleton active /></Card>
          <Card className="brutal-card h-[250px]"><Skeleton active /></Card>
        </div>
      ) : (
        <>
          {Object.keys(groupedDecks).length === 0 ? (
            <div className="text-center py-20 brutal-card bg-white">
              <h2 className="text-2xl font-black uppercase mb-4 text-[#1D2A3A]">Bạn chưa học bộ thẻ nào!</h2>
              <Button
                onClick={() => navigate('/decks')}
                className="brutal-border bg-[#FFD700] text-black font-black h-12 px-6 uppercase hover:-translate-y-1 transition-transform"
              >
                Khám phá ngay
              </Button>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedDecks).map(([topicName, items]) => (
                <div key={topicName} className="flex flex-col">
                  {/* Brutalist Topic Header */}
                  <div className="mb-6 inline-flex">
                    <div className="bg-[#2A8B9D] text-white px-6 py-2 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1 hover:rotate-0 transition-transform">
                      <h2 className="text-2xl font-black uppercase tracking-tight m-0">{topicName}</h2>
                    </div>
                  </div>

                  {/* Grid of Decks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {items.map(({ deck, enrollment }) => (
                      <EnrolledDeckCard
                        key={enrollment.id}
                        deck={deck}
                        masteredCards={enrollment.masteredCards || 0}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
