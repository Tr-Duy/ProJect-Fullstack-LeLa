import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Skeleton, Tag } from 'antd';
import { ArrowLeftOutlined, SoundOutlined, CheckCircleOutlined, FieldTimeOutlined } from '@ant-design/icons';
import { decksApi } from '../api/decks.api';
import { flashcardsApi } from '../api/flashcards.api';
import { deckEnrollmentsApi } from '../api/deck-enrollments.api';
import { quizzesApi } from '../../quiz/api/quizzes.api';
import { quizAttemptsApi } from '../../quiz/api/quiz-attempts.api';
import { useAuth } from '../../../shared/providers/AuthProvider';

export function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    e.preventDefault();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const { data: deck, isLoading: isLoadingDeck, isError: isErrorDeck, error: errorDeck } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => decksApi.getById(Number(deckId)),
    enabled: !!deckId,
  });

  const { data: cardsPage, isLoading: isLoadingCards } = useQuery({
    queryKey: ['deck-flashcards', deckId],
    queryFn: () => flashcardsApi.getByDeckId(Number(deckId), { size: 1000 }),
    enabled: !!deckId && !isErrorDeck,
  });

  const { data: enrollmentsPage } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => deckEnrollmentsApi.getMyList({ size: 100 }),
    enabled: !!deckId && !!user && !isErrorDeck,
  });

  const { data: quizzesResp } = useQuery({
    queryKey: ['deck-quizzes', deckId],
    queryFn: () => quizzesApi.getByDeckId(Number(deckId)),
    enabled: !!deckId && !isErrorDeck,
  });

  const { data: attemptsResp } = useQuery({
    queryKey: ['my-quiz-attempts', deckId],
    queryFn: () => quizAttemptsApi.getMyAttempts({ size: 100 }),
    enabled: !!deckId && !!user && !isErrorDeck,
  });

  const enrollment = enrollmentsPage?.data?.content?.find(e => e.deckId === Number(deckId));
  const quizzes = quizzesResp?.data || [];
  const myAttempts = attemptsResp?.data?.content || [];

  const cards = cardsPage?.content || [];

  if (isLoadingDeck) {
    return <div className="p-8 max-w-5xl mx-auto"><Skeleton active /></div>;
  }

  if (isErrorDeck || !deck) {
    const errMessage = (errorDeck as any)?.response?.data?.message || (errorDeck as any)?.message;
    return (
      <div className="p-8 max-w-3xl mx-auto text-center min-h-[60vh] flex flex-col justify-center items-center">
        <div className="text-7xl mb-4">🔒</div>
        <h2 className="text-3xl md:text-4xl font-black uppercase text-[#1D2A3A] mb-3">
          {!user ? 'Đăng nhập để học TOEIC theo đúng trình độ' : 'Bộ thẻ ngoài trình độ hiện tại'}
        </h2>
        <p className="text-gray-600 font-bold text-base md:text-lg mb-8 max-w-xl">
          {errMessage || (!user 
            ? 'LeLa cá nhân hóa bộ từ vựng TOEIC theo trình độ mục tiêu của bạn. Vui lòng đăng nhập để mở khóa bài học.'
            : 'Bộ thẻ TOEIC này dành cho cấp độ khác. Vui lòng chọn và học bộ thẻ đúng trình độ mục tiêu của bạn.')}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {!user && (
            <>
              <Button onClick={() => navigate('/login')} className="brutal-pill font-black uppercase px-8 h-12 bg-[#F05A4A] text-white hover:bg-[#d94f41] border-2 border-black">
                ĐĂNG NHẬP
              </Button>
              <Button onClick={() => navigate('/register')} className="brutal-pill font-black uppercase px-8 h-12 bg-white text-black border-2 border-black">
                ĐĂNG KÝ
              </Button>
            </>
          )}
          {user && !user.currentLevel && (
            <Button onClick={() => navigate('/onboarding')} className="brutal-pill font-black uppercase px-8 h-12 bg-[#1D2A3A] text-white border-2 border-black">
              CHỌN TRÌNH ĐỘ NGAY
            </Button>
          )}
          <Button onClick={() => navigate('/decks')} className="brutal-pill font-bold uppercase px-8 h-12 bg-gray-200 border-2 border-black">
            VỀ DANH SÁCH BỘ THẺ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen">
      <Button 
        onClick={() => navigate(-1)} 
        icon={<ArrowLeftOutlined />}
        className="brutal-pill bg-white hover:bg-gray-100 font-bold px-6 py-2 flex items-center gap-2 mb-6"
      >
        QUAY LẠI
      </Button>

      <div className="brutal-card brutal-shadow bg-white flex flex-col md:flex-row overflow-hidden mb-12">
        <div 
          className="h-64 md:h-auto md:w-1/3 bg-gray-200 border-b-[3px] md:border-b-0 md:border-r-[3px] border-black bg-cover bg-center"
          style={{ backgroundImage: `url(${deck.coverImageUrl || 'https://placehold.co/400x400/F4F3EE/1D2A3A?text=No+Image'})` }}
        />
        <div className="p-6 md:p-10 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-4">
            <Tag className="brutal-border font-bold text-sm px-3 py-1" color="#2A8B9D">
              {deck.topic?.name || 'Chủ đề chung'}
            </Tag>
            <span className="text-sm font-bold bg-[#F4F3EE] px-3 py-1 brutal-border">
              {deck.totalCards} thẻ
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black uppercase text-[#1D2A3A] mb-4 leading-tight">
            {deck.title}
          </h1>
          <p className="text-gray-600 text-lg mb-8 flex-1">
            {deck.description || 'Không có mô tả cho bộ thẻ này.'}
          </p>
          
          <div className="mt-auto">
            {enrollment ? (
              <div className="flex flex-col md:flex-row items-center justify-between bg-[#F4F3EE] p-4 brutal-border border-black shadow-[4px_4px_0px_0px_#000] gap-6">
                <div className="flex flex-1 items-center gap-4 w-full">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-500 uppercase mb-1">Tiến độ của bạn</p>
                    <p className="text-xl font-black text-[#1D2A3A]">{enrollment.masteredCards} / {deck.totalCards} thẻ</p>
                  </div>
                  {enrollment.lastStudiedAt && (
                    <div className="flex-1 border-l-[2px] border-black pl-4">
                      <p className="text-sm font-bold text-gray-500 uppercase mb-1">Học lần cuối</p>
                      <p className="text-xl font-black text-[#1D2A3A]">{new Date(enrollment.lastStudiedAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  )}
                </div>
                <Button 
                  className="w-full md:w-auto brutal-pill font-black uppercase h-12 px-10 bg-[#2A8B9D] text-white hover:-translate-y-1 transition-transform text-lg border-black shrink-0"
                  onClick={() => user ? navigate(`/study/${deck.id}`) : navigate('/login')}
                >
                  TIẾP TỤC HỌC
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full md:w-auto brutal-pill font-black uppercase h-14 px-12 bg-[#F05A4A] text-white hover:-translate-y-1 transition-transform text-xl border-black"
                onClick={() => user ? navigate(`/study/${deck.id}`) : navigate('/login')}
              >
                HỌC BỘ THẺ NÀY
              </Button>
            )}
          </div>
        </div>
      </div>

      {quizzes.length > 0 && (
        <div className="mb-12">
          <div className="mb-8 border-b-[3px] border-black pb-4 flex justify-between items-end">
            <h2 className="text-3xl font-black uppercase text-[#1D2A3A]">Bài kiểm tra & Luyện tập</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {quizzes.map(quiz => {
              const attemptsForQuiz = myAttempts.filter((a: any) => a.quizId === quiz.id && (a.status === 'SUBMITTED' || a.status === 'COMPLETED'));
              let highestScore: number | null = null;
              if (attemptsForQuiz.length > 0) {
                highestScore = Math.max(...attemptsForQuiz.map((a: any) => a.scorePercent != null ? Number(a.scorePercent) : 0));
              }

              const isQuick = quiz.quizCode?.includes('QUICK');
              const isStd = quiz.quizCode?.includes('STD');
              const isChallenge = quiz.quizCode?.includes('CHALLENGE');

              return (
                <div key={quiz.id} className="brutal-card bg-[#F4F3EE] p-6 flex flex-col justify-between gap-6 border-[3px] border-black shadow-[4px_4px_0px_0px_#000]">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-black text-xs px-2 py-1 bg-white brutal-border border-[2px]">
                        {quiz.totalQuestions || 0} câu hỏi
                      </span>
                      {isQuick && <span className="font-black text-xs px-2 py-1 bg-yellow-300 brutal-border border-[2px]">⚡ LUYỆN NHANH</span>}
                      {isStd && <span className="font-black text-xs px-2 py-1 bg-blue-300 brutal-border border-[2px]">📝 TIÊU CHUẨN</span>}
                      {isChallenge && <span className="font-black text-xs px-2 py-1 bg-red-300 brutal-border border-[2px]">🔥 THỬ THÁCH</span>}
                    </div>

                    <h3 className="text-xl font-black text-[#1D2A3A] mb-2">{quiz.title}</h3>
                    <p className="text-sm text-gray-600 font-medium mb-4">{quiz.description}</p>

                    <div className="flex items-center gap-2 text-gray-700 font-bold text-sm flex-wrap">
                      <span className="flex items-center gap-1 bg-white px-2 py-1 brutal-border border-[2px]">
                        <FieldTimeOutlined /> {quiz.timeLimitSeconds ? `${Math.floor(quiz.timeLimitSeconds / 60)} phút` : 'Tự do'}
                      </span>
                      <span className="flex items-center gap-1 bg-white px-2 py-1 brutal-border border-[2px]">
                        <CheckCircleOutlined /> 
                        {highestScore !== null ? `Đạt: ${Math.round(highestScore)}%` : 'Chưa làm'}
                      </span>
                    </div>
                  </div>

                  <Button 
                    className="brutal-pill font-black h-12 px-6 uppercase !bg-[#1D2A3A] !text-white hover:!bg-[#2A8B9D] transition-colors w-full"
                    onClick={() => user ? navigate(`/quiz/${quiz.id}/start`) : navigate('/login')}
                  >
                    Bắt đầu quiz ➔
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-8 border-b-[3px] border-black pb-4">
        <h2 className="text-3xl font-black uppercase text-[#1D2A3A]">Danh sách từ vựng</h2>
      </div>

      {isLoadingCards ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="brutal-card p-6 h-32 bg-white">
              <Skeleton active paragraph={{ rows: 1 }} />
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-12 brutal-card bg-white">
          <p className="text-xl font-bold text-gray-500">Bộ thẻ này chưa có từ vựng nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => (
            <div key={card.id} className="brutal-card brutal-shadow bg-white p-6 flex flex-col relative group hover:-translate-y-1 transition-transform">
              <button
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-[#2A8B9D] hover:bg-[#1D2A3A] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white rounded-full transition-all cursor-pointer z-10"
                onClick={(e) => handleSpeak(e, card.frontText)}
                title="Phát âm"
              >
                <SoundOutlined />
              </button>
              <div className="mb-4 pr-10">
                <h3 className="text-2xl font-black text-[#1D2A3A] mb-1 leading-tight">{card.frontText}</h3>
                {card.phonetic && (
                  <p className="text-md font-bold text-gray-500">/{card.phonetic}/</p>
                )}
              </div>
              
              <div className="mt-auto pt-4 border-t-[2px] border-black border-dashed">
                <p className="text-xl font-bold text-[#2A8B9D]">{card.backText}</p>
                {card.exampleText && (
                  <p className="text-sm font-medium italic text-gray-600 mt-2">
                    "{card.exampleText}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
