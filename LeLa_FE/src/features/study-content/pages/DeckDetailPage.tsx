import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Skeleton, Tag } from 'antd';
import { ArrowLeftOutlined, SoundOutlined, CheckCircleOutlined } from '@ant-design/icons';
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
        <h2 className="text-3xl md:text-4xl font-black  text-[#2B1B0E] mb-3">
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
              <Button onClick={() => navigate('/login')} className="brutal-pill font-bold px-8 h-12 bg-[#F05A4A] text-white hover:bg-[#d94f41] border-2 border-[var(--border)]">
                ĐĂNG NHẬP
              </Button>
              <Button onClick={() => navigate('/register')} className="brutal-pill font-bold px-8 h-12 bg-white text-black border-2 border-[var(--border)]">
                ĐĂNG KÝ
              </Button>
            </>
          )}
          {user && !user.currentLevel && (
            <Button onClick={() => navigate('/onboarding')} className="brutal-pill font-bold px-8 h-12 bg-[#2B1B0E] text-white border-2 border-[var(--border)]">
              CHỌN TRÌNH ĐỘ NGAY
            </Button>
          )}
          <Button onClick={() => navigate('/decks')} className="brutal-pill font-bold px-8 h-12 bg-gray-200 border-2 border-[var(--border)]">
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

      <div className="rounded-[var(--radius-card)] shadow-[var(--shadow-md)] bg-white flex flex-col md:flex-row overflow-hidden mb-12">
        <div 
          className="h-64 md:h-auto md:w-1/3 bg-gray-200 border-b-[3px] md:border-b-0 md:border-r-[3px] border-[var(--border)] bg-cover bg-center"
          style={{ backgroundImage: `url(${deck.coverImageUrl || 'https://placehold.co/400x400/F4F3EE/1D2A3A?text=No+Image'})` }}
        />
        <div className="p-6 md:p-10 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-4">
            <Tag className="border border-[var(--border)] font-bold text-sm px-3 py-1" color="#2A8B9D">
              {deck.topic?.name || 'Chủ đề chung'}
            </Tag>
            <span className="text-sm font-bold bg-[#F4F3EE] px-3 py-1 border border-[var(--border)]">
              {deck.totalCards} thẻ
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black  text-[#2B1B0E] mb-4 leading-tight">
            {deck.title}
          </h1>
          <p className="text-gray-600 text-lg mb-8 flex-1">
            {deck.description || 'Không có mô tả cho bộ thẻ này.'}
          </p>
          
          <div className="mt-auto">
            {enrollment ? (
              <div className="flex flex-col md:flex-row items-center justify-between bg-[#F4F3EE] p-4 border border-[var(--border)] border-[var(--border)] shadow-[var(--shadow-sm)] gap-6">
                <div className="flex flex-1 items-center gap-4 w-full">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-500  mb-1">Tiến độ của bạn</p>
                    <p className="text-xl font-black text-[#2B1B0E]">{enrollment.masteredCards} / {deck.totalCards} thẻ</p>
                  </div>
                  {enrollment.lastStudiedAt && (
                    <div className="flex-1 border-l-[2px] border-[var(--border)] pl-4">
                      <p className="text-sm font-bold text-gray-500  mb-1">Học lần cuối</p>
                      <p className="text-xl font-black text-[#2B1B0E]">{new Date(enrollment.lastStudiedAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  )}
                </div>
                <Button 
                  className="w-full md:w-auto brutal-pill font-black h-12 px-10 bg-[#2A8B9D] text-white hover:-translate-y-1 transition-transform text-lg border-[var(--border)] shrink-0"
                  onClick={() => {
                    const isCompleted = deck.totalCards > 0 && (enrollment.masteredCards || 0) >= deck.totalCards;
                    if (user) {
                      navigate(isCompleted ? `/study/${deck.id}?mode=cram` : `/study/${deck.id}`);
                    } else {
                      navigate('/login');
                    }
                  }}
                >
                  {deck.totalCards > 0 && (enrollment.masteredCards || 0) >= deck.totalCards ? 'ÔN LẠI' : 'TIẾP TỤC HỌC'}
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full md:w-auto brutal-pill font-bold h-14 px-12 bg-[#F05A4A] text-white hover:-translate-y-1 transition-transform text-xl border-[var(--border)]"
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
          <div className="mb-8 border-b-[3px] border-[var(--border)] pb-4 flex justify-between items-end">
            <h2 className="text-3xl font-black  text-[#2B1B0E]">Bài kiểm tra & Luyện tập</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {quizzes.map(quiz => {
              const attemptsForQuiz = myAttempts.filter((a: any) => a.quizId === quiz.id && (a.status === 'SUBMITTED' || a.status === 'COMPLETED'));
              let highestScore: number | null = null;
              if (attemptsForQuiz.length > 0) {
                highestScore = Math.max(...attemptsForQuiz.map((a: any) => a.scorePercent != null ? Number(a.scorePercent) : 0));
              }

              const isEasy = quiz.difficulty === 'EASY' || quiz.quizCode?.includes('EASY') || quiz.quizCode?.includes('QUICK');
              const isMedium = quiz.difficulty === 'MEDIUM' || quiz.quizCode?.includes('MEDIUM') || quiz.quizCode?.includes('STD');
              const isHard = quiz.difficulty === 'HARD' || quiz.quizCode?.includes('HARD') || quiz.quizCode?.includes('CHALLENGE');

              return (
                <div key={quiz.id} className="rounded-[var(--radius-card)] bg-[#F4F3EE] p-6 flex flex-col justify-between gap-6 border border-[var(--border)] shadow-[var(--shadow-sm)]">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-black text-xs px-2 py-1 bg-white border border-[var(--border)] border-[2px]">
                        {quiz.totalQuestions || 0} câu hỏi
                      </span>
                      {isEasy && <span className="font-black text-xs px-2 py-1 bg-emerald-300 text-emerald-950 border border-[var(--border)] border-[2px]">🟢 DỄ</span>}
                      {isMedium && <span className="font-black text-xs px-2 py-1 bg-amber-300 text-amber-950 border border-[var(--border)] border-[2px]">🟡 VỪA</span>}
                      {isHard && <span className="font-black text-xs px-2 py-1 bg-rose-300 text-rose-950 border border-[var(--border)] border-[2px]">🔴 KHÓ</span>}
                    </div>

                    <h3 className="text-xl font-black text-[#2B1B0E] mb-2">{quiz.title}</h3>
                    <p className="text-sm text-gray-600 font-medium mb-4">{quiz.description}</p>

                    <div className="flex items-center gap-2 text-gray-700 font-bold text-sm flex-wrap">
                      <span className="flex items-center gap-1 bg-white px-2 py-1 border border-[var(--border)] border-[2px]">
                        🎯 Yêu cầu: Đạt ≥ 70%
                      </span>
                      <span className="flex items-center gap-1 bg-white px-2 py-1 border border-[var(--border)] border-[2px]">
                        <CheckCircleOutlined /> 
                        {highestScore !== null ? `Đã làm: ${Math.round(highestScore)}% (${highestScore >= 70 ? 'ĐẠT' : 'CHƯA ĐẠT'})` : 'Chưa làm'}
                      </span>
                    </div>
                  </div>

                  <Button 
                    className="rounded-xl font-semibold h-11 px-6 !bg-[var(--brand)] !text-[#2A1300] hover:!bg-[var(--brand-600)] transition-colors w-full btn-shine cursor-pointer"
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

      <div className="mb-8 border-b-[3px] border-[var(--border)] pb-4">
        <h2 className="text-3xl font-black  text-[#2B1B0E]">Danh sách từ vựng</h2>
      </div>

      {isLoadingCards ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-[var(--radius-card)] p-6 h-32 bg-white">
              <Skeleton active paragraph={{ rows: 1 }} />
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-12 rounded-[var(--radius-card)] bg-white">
          <p className="text-xl font-bold text-gray-500">Bộ thẻ này chưa có từ vựng nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => {
            const word = card.word || card.frontText;
            const meaning = card.vietnameseMeaning || card.backText;
            const exampleEn = card.exampleEn || card.exampleText;
            const exampleVi = card.exampleVi || card.exampleTranslation;
            const pos = card.partOfSpeech;
            const phonetic = card.phonetic ? (card.phonetic.startsWith('/') ? card.phonetic : `/${card.phonetic}/`) : '';

            return (
              <div key={card.id} className="rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] bg-[#FDFBF7] p-5 flex flex-col justify-between relative group hover:-translate-y-1 transition-transform">
                <button
                  className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-white hover:bg-amber-100 active:scale-95 border border-black shadow-[2px_2px_0px_#000] text-black rounded-full transition-all cursor-pointer z-10"
                  onClick={(e) => handleSpeak(e, word)}
                  title="Phát âm"
                >
                  <SoundOutlined />
                </button>
                <div className="mb-3 pr-10">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-black text-[#181E24] leading-tight m-0">{word}</h3>
                    {pos && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-200 border border-black text-black">
                        ({pos})
                      </span>
                    )}
                  </div>
                  {phonetic && (
                    <p className="text-sm font-mono text-slate-500 font-medium">{phonetic}</p>
                  )}
                </div>
                
                <div className="mt-auto pt-3 border-t-2 border-black/10">
                  <p className="text-lg font-black text-emerald-600">{meaning}</p>
                  {(exampleEn || exampleVi) && (
                    <div className="mt-2 p-2.5 bg-amber-50/60 border border-black/15 rounded-xl text-xs">
                      {exampleEn && <p className="font-semibold text-slate-800 italic">"{exampleEn}"</p>}
                      {exampleVi && <p className="text-slate-600 mt-1">👉 {exampleVi}</p>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
