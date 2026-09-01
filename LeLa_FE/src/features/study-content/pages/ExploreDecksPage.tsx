import { useQuery } from '@tanstack/react-query';
import { Card, Tag, Button, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined, UserOutlined, SignalFilled, InfoCircleOutlined } from '@ant-design/icons';
import { useState, useMemo } from 'react';
import { decksApi } from '../api/decks.api';
import { deckEnrollmentsApi } from '../api/deck-enrollments.api';
import { tagsApi } from '../../master-data/api/tags.api';
import { useAuth } from '../../../shared/providers/AuthProvider';

const difficultyColors = {
  BEGINNER: '#2A8B9D', // Teal
  INTERMEDIATE: '#F05A4A', // Coral
  ADVANCED: '#1D2A3A', // Navy
};

const difficultyLabels = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

export function ExploreDecksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  const { data: tagsResponse } = useQuery({
    queryKey: ['tags-for-explore'],
    queryFn: () => tagsApi.getAll({ size: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const availableTags = tagsResponse?.data?.content || [];
  
  const filterExamTypeId = user?.currentExamType?.id;
  const filterLevelId = user?.currentLevel?.id;

  const { data: enrollmentsResponse } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => deckEnrollmentsApi.getMyList({ size: 100 }),
    enabled: !!user,
  });

  const enrolledDeckIds = useMemo(() => {
    const list = enrollmentsResponse?.data?.content || [];
    return new Set(list.map((e: any) => e.deckId));
  }, [enrollmentsResponse]);

  const { data, isLoading } = useQuery({
    queryKey: ['explore-decks', user?.id || 'guest', user?.currentLevel?.id || 'no-level', user?.roles?.join('-') || 'guest'],
    queryFn: () => decksApi.getAll({ 
      size: 100,
      ...(filterExamTypeId ? { examTypeId: filterExamTypeId } : {}),
      ...(filterLevelId ? { levelId: filterLevelId } : {}),
    }),
    placeholderData: (prev) => prev,
  });

  const decks = data?.content || [];
  
  const searchedDecks = decks.filter((deck: any) => {
    let match = true;
    
    // Exclude decks user has already enrolled / studied
    if (enrolledDeckIds.has(deck.id)) {
      return false;
    }

    // Check tag filter
    if (selectedTag !== 'ALL') {
      const matchTag = deck.title.toLowerCase().includes(selectedTag.toLowerCase()) ||
        (deck.topic?.name && deck.topic.name.toLowerCase().includes(selectedTag.toLowerCase())) ||
        (deck.description && deck.description.toLowerCase().includes(selectedTag.toLowerCase()));
      if (!matchTag) match = false;
    }

    // Check search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSearch = deck.title.toLowerCase().includes(q) || 
        (deck.description && deck.description.toLowerCase().includes(q)) ||
        (deck.topic?.name && deck.topic.name.toLowerCase().includes(q));
      if (!matchSearch) match = false;
    }
    
    return match;
  });

  const featuredDeck = searchedDecks.find((d: any) => d.isFeatured) || null;
  const standardDecks = searchedDecks.filter((d: any) => d.id !== featuredDeck?.id);

  const decksByTopic = standardDecks.reduce((acc: any, deck: any) => {
    const topicName = deck.topic?.name || 'Chung';
    if (!acc[topicName]) acc[topicName] = [];
    acc[topicName].push(deck);
    return acc;
  }, {});
  const topicEntries = Object.entries(decksByTopic);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const isAdmin = user?.roles?.includes('ADMIN');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#F4F3EE]">
      {/* Search & Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#1D2A3A] mb-2">Khám phá bộ thẻ</h1>
          <p className="text-gray-600 font-bold text-lg">Tìm kiếm hàng ngàn bộ flashcard chất lượng cao.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* TOPIC TAG FILTER DROPDOWN */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full sm:w-56 h-14 bg-white border-2 border-[#1D2A3A] rounded-2xl px-4 text-sm font-bold text-[#1D2A3A] shadow-[4px_4px_0px_0px_#1D2A3A] focus:outline-none cursor-pointer"
          >
            <option value="ALL">🏷️ Tất cả chủ đề (Tags)</option>
            {availableTags.map((t) => (
              <option key={t.id} value={t.name}>
                🏷️ {t.name} ({t.deckCount ?? 0} decks)
              </option>
            ))}
          </select>

          <form 
            onSubmit={handleSearch}
            className="w-full md:w-[360px] brutal-pill bg-white flex items-center h-14 focus-within:translate-y-[2px] transition-transform overflow-hidden cursor-text"
            onClick={(e) => { const input = e.currentTarget.querySelector('input'); if (input) input.focus(); }}
          >
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Bạn muốn học gì hôm nay?" 
            className="flex-1 bg-transparent border-none outline-none shadow-none focus:outline-none focus:ring-0 px-6 text-base font-bold h-full min-w-0 placeholder:text-gray-400 placeholder:font-medium" 
          />
          <button 
            type="submit"
            className="h-full px-8 font-black uppercase flex items-center justify-center gap-2 bg-[#F05A4A] text-white border-l-[3px] border-black hover:bg-[#d94f41] transition-colors shrink-0 outline-none"
          >
            <SearchOutlined className="text-xl" />
            TÌM
          </button>
        </form>
      </div>
    </div>

      {/* USER CONTEXT BANNERS */}

      {/* Case 1: GUEST */}
      {!user && (
        <div className="mb-10 brutal-card p-6 md:p-8 bg-gradient-to-r from-amber-50 to-orange-50 brutal-border border-2 border-black flex flex-col md:flex-row justify-between items-center gap-6 shadow-[4px_4px_0px_0px_#000]">
          <div>
            <div className="inline-block bg-black text-amber-300 font-black text-xs px-3 py-1 mb-2 uppercase tracking-wider brutal-border border border-black">
              🔒 KHU VỰC TOEIC THEO TRÌNH ĐỘ
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase text-[#1D2A3A] mb-1">
              Đăng nhập để học TOEIC theo đúng trình độ của bạn
            </h2>
            <p className="text-gray-700 font-semibold text-base">
              Chọn trình độ TOEIC của bạn để LeLa đề xuất bộ từ vựng và bài kiểm tra phù hợp nhất.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button 
              className="brutal-pill font-black bg-[#F05A4A] text-white h-12 px-6 hover:bg-[#d94f41] border-2 border-black"
              onClick={() => navigate('/login')}
            >
              ĐĂNG NHẬP
            </Button>
            <Button 
              className="brutal-pill font-black bg-white text-black h-12 px-6 hover:bg-gray-100 border-2 border-black"
              onClick={() => navigate('/register')}
            >
              ĐĂNG KÝ
            </Button>
          </div>
        </div>
      )}

      {/* Case 2: LEARNER WITHOUT LEVEL */}
      {user && !isAdmin && !user.currentLevel && (
        <div className="mb-10 brutal-card p-6 md:p-8 bg-gradient-to-r from-yellow-50 to-amber-100 brutal-border border-2 border-black flex flex-col md:flex-row justify-between items-center gap-6 shadow-[4px_4px_0px_0px_#000]">
          <div>
            <div className="inline-block bg-amber-400 text-black font-black text-xs px-3 py-1 mb-2 uppercase tracking-wider brutal-border border border-black">
              🎯 CÁ NHÂN HÓA LỘ TRÌNH TOEIC
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase text-[#1D2A3A] mb-1">
              Bạn chưa chọn trình độ TOEIC
            </h2>
            <p className="text-gray-700 font-semibold text-base">
              Chọn trình độ để LeLa gợi ý bộ từ vựng TOEIC phù hợp nhất với mục tiêu điểm số của bạn.
            </p>
          </div>
          <Button 
            className="brutal-pill font-black bg-[#1D2A3A] text-white h-12 px-8 hover:bg-black border-2 border-black shrink-0"
            onClick={() => navigate('/onboarding')}
          >
            CHỌN TRÌNH ĐỘ NGAY ➔
          </Button>
        </div>
      )}

      {/* Case 3: LEARNER WITH LEVEL */}
      {user && !isAdmin && user.currentLevel && (
        <div className="mb-8 p-4 bg-white brutal-card brutal-border border-2 border-black flex items-center justify-between shadow-[4px_4px_0px_0px_#000]">
          <div className="flex items-center gap-3">
            <span className="font-black text-xs uppercase px-3 py-1 bg-yellow-300 brutal-border border border-black">
              🎯 LỘ TRÌNH TOEIC
            </span>
            <span className="font-black text-base md:text-lg text-[#1D2A3A]">
              TRÌNH ĐỘ CỦA BẠN: <span className="text-[#F05A4A]">{user.currentLevel.name}</span>
            </span>
          </div>
          <Button 
            size="small"
            className="font-bold text-xs brutal-border border border-black"
            onClick={() => navigate('/onboarding')}
          >
            Đổi trình độ ⚙️
          </Button>
        </div>
      )}

      {/* Case 4: ADMIN */}
      {isAdmin && (
        <div className="mb-8 p-4 bg-[#1D2A3A] text-white brutal-card brutal-border border-2 border-black flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[4px_4px_0px_0px_#000]">
          <div className="font-bold text-sm md:text-base">
            👑 Bạn đang xem với quyền <span className="text-yellow-400 font-black">ADMINISTRATOR</span> (Hiển thị tất cả bộ thẻ).
          </div>
          <Button 
            className="brutal-pill font-black bg-yellow-400 text-black border-2 border-black shrink-0"
            onClick={() => navigate('/admin/decks')}
          >
            QUẢN LÝ DECKS ADMIN ➔
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="brutal-card w-full h-[300px]">
              <Skeleton active />
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Featured Deck */}
          {featuredDeck && (
            <div className="mb-12">
              <div className="inline-flex relative z-10 -mb-4 ml-6 lg:ml-10">
                <div className="bg-[#FFD700] text-black px-6 py-2 brutal-border border-black shadow-[4px_4px_0px_0px_#000] -rotate-2">
                  <h2 className="text-2xl font-black uppercase tracking-tight m-0">Nổi Bật Hôm Nay</h2>
                </div>
              </div>
              
              <div className="brutal-card brutal-shadow bg-white flex flex-col lg:flex-row overflow-hidden hover:-translate-y-1 transition-transform duration-300">
                <div 
                  className="h-64 lg:h-auto lg:w-1/2 bg-gray-200 border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black bg-cover bg-center"
                  style={{ backgroundImage: `url(${featuredDeck.coverImageUrl || 'https://placehold.co/800x600/F4F3EE/1D2A3A?text=Featured'})` }}
                />
                <div className="p-8 lg:p-12 flex flex-col justify-center flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag className="brutal-border font-bold text-sm px-3 py-1 m-0" color="#2A8B9D">
                      {featuredDeck.topic?.name || 'Chung'}
                    </Tag>
                    <span className="text-sm font-bold bg-[#F4F3EE] px-3 py-1 brutal-border border-black">
                      {featuredDeck.totalCards} thẻ
                    </span>
                    <span className="text-sm font-bold bg-[#F4F3EE] px-3 py-1 brutal-border border-black flex items-center gap-1" style={{ color: difficultyColors[featuredDeck.difficulty] }}>
                      <SignalFilled /> {difficultyLabels[featuredDeck.difficulty]}
                    </span>
                  </div>
                  
                  <h3 className="text-4xl lg:text-5xl font-black uppercase text-[#1D2A3A] leading-tight mb-4 line-clamp-2">
                    {featuredDeck.title}
                  </h3>
                  <p className="text-gray-600 text-lg mb-8 line-clamp-3">
                    {featuredDeck.description || 'Chưa có mô tả chi tiết cho bộ thẻ này.'}
                  </p>
                  
                  <div className="flex items-center gap-6 mt-auto">
                    <Button 
                      className="brutal-pill font-black uppercase h-14 px-10 bg-[#1D2A3A] text-white hover:bg-black transition-colors text-lg border-[2px] border-black"
                      onClick={() => navigate(`/decks/${featuredDeck.id}`)}
                    >
                      XEM CHI TIẾT
                    </Button>
                    <div className="flex items-center gap-2 text-gray-500 font-bold">
                      <UserOutlined className="text-xl" />
                      <span className="text-lg">{featuredDeck.enrollmentCount} người học</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Standard Decks by Topic */}
          {topicEntries.length > 0 && (
            <div className="mb-6 flex flex-col gap-12">
              {topicEntries.map(([topicName, topicDecks]: [string, any]) => (
                <div key={topicName}>
                  {/* Brutalist Topic Header */}
                  <div className="mb-6 inline-flex">
                    <div className="bg-[#2A8B9D] text-white px-6 py-2 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1 hover:rotate-0 transition-transform">
                      <h2 className="text-2xl font-black uppercase tracking-tight m-0">{topicName}</h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {topicDecks.map((deck: any) => (
                      <div 
                        key={deck.id} 
                        className="brutal-card brutal-shadow bg-white flex flex-col h-full overflow-hidden transition-transform duration-300 hover:-translate-y-2"
                      >
                        <div 
                          className="h-32 bg-gray-200 border-b-[3px] border-black bg-cover bg-center relative"
                          style={{ backgroundImage: `url(${deck.coverImageUrl || 'https://placehold.co/400x200/F4F3EE/1D2A3A?text=No+Image'})` }}
                        />
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
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                            {deck.description || 'Chưa có mô tả chi tiết cho bộ thẻ này.'}
                          </p>

                          <div className="mb-4 mt-auto">
                            <div className="flex justify-between items-center text-xs font-bold text-gray-700 uppercase pt-3 border-t-[2px] border-black border-dashed">
                              <span className="flex items-center gap-1" style={{ color: difficultyColors[deck.difficulty as keyof typeof difficultyColors] }}>
                                <SignalFilled /> {difficultyLabels[deck.difficulty as keyof typeof difficultyLabels]}
                              </span>
                              <span>{deck.totalCards} thẻ</span>
                            </div>
                            <div className="flex items-center gap-1 font-bold text-gray-500 text-xs mt-2">
                              <UserOutlined /> {deck.enrollmentCount} người học
                            </div>
                          </div>

                          <div className="mt-auto flex gap-2">
                            <Button 
                              className="flex-1 brutal-pill font-black uppercase h-10 !bg-[#F05A4A] !text-white border-[2px] border-black hover:!bg-[#d94f41] hover:!translate-y-[-2px]"
                              onClick={() => navigate(`/decks/${deck.id}`)}
                            >
                              XEM CHI TIẾT
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!isLoading && standardDecks.length === 0 && !featuredDeck && (
            <div className="text-center py-20 brutal-card bg-white shadow-[4px_4px_0px_0px_#000]">
              <h2 className="text-2xl font-black uppercase text-[#1D2A3A]">Không tìm thấy bộ thẻ nào phù hợp với trình độ của bạn.</h2>
            </div>
          )}
        </>
      )}
    </div>
  );
}
