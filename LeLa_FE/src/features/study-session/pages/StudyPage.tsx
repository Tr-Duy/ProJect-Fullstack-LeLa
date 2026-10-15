import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Skeleton } from 'antd';
import { ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons';
import { useStudySession } from '../hooks/useStudySession';
import { FlipCard } from '../components/FlipCard';
import { motion } from 'motion/react';

export function StudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const isCramMode = mode === 'cram';

  const {
    currentCard,
    isFinished,
    isLoading,
    sessionStats,
    handleReview,
    studyQueue,
    restartSession
  } = useStudySession(deckId, mode);

  const queryClient = useQueryClient();

  const [showBack, setShowBack] = useState(false);

  const handleNext = async (rating: number) => {
    await handleReview(rating);
    setShowBack(false);
  };

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

  // Keyboard shortcut support (Space: flip, 1-4: SM-2 ratings)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs/modals
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setShowBack((prev) => !prev);
      } else if (showBack) {
        if (e.key === '1') {
          e.preventDefault();
          handleNext(1);
        } else if (e.key === '2') {
          e.preventDefault();
          handleNext(2);
        } else if (e.key === '3') {
          e.preventDefault();
          handleNext(3);
        } else if (e.key === '4') {
          e.preventDefault();
          handleNext(4);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showBack, currentCard]);

  const getButtonLabels = () => {
    return {
      again: '< 1m',
      hard: '5m',
      good: '10m',
      easy: '4d'
    };
  };

  if (isLoading || (!isFinished && !currentCard)) {
    return <div className="p-8 max-w-2xl mx-auto"><Skeleton active /></div>;
  }

  if (isFinished) {
    const isZeroDueSRS = sessionStats.reviewed === 0 && !isCramMode;

    return (
      <div className="min-h-screen bg-[#F4F3EE] p-8 flex items-center justify-center relative overflow-hidden">
        {/* Simple Confetti Effect via Framer Motion */}
        {!isZeroDueSRS && Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-3 h-3 rounded-sm ${['bg-[#F05A4A]', 'bg-[#2A8B9D]', 'bg-[#FFD700]', 'bg-brand-navy'][i % 4]} border border-[var(--border)]`}
            initial={{
              x: '50vw',
              y: '100vh',
              opacity: 1
            }}
            animate={{
              x: `${Math.random() * 100}vw`,
              y: `${Math.random() * -100}vh`,
              rotate: Math.random() * 360,
              opacity: 0
            }}
            transition={{ duration: 2.5 + Math.random() * 2, ease: "easeOut" }}
          />
        ))}

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="max-w-md w-full text-center rounded-[var(--radius-card)] bg-white p-8 sm:p-10 shadow-[var(--shadow-md)] border border-[var(--border)] relative z-10"
        >
          {isZeroDueSRS ? (
            <>
              <div className="text-6xl mb-4">✨</div>
              <h2 className="text-3xl sm:text-4xl font-black mb-2 text-brand-navy">Chưa có thẻ đến hạn!</h2>
              <p className="mb-6 font-bold text-gray-600 text-base">
                Bạn đã hoàn thành tất cả thẻ cần ôn theo lịch SM-2 hôm nay. Bạn có muốn ôn tập tự do toàn bộ bộ thẻ này không?
              </p>

              <div className="bg-[#F4F3EE] border border-[var(--border)] p-4 mb-6 flex justify-around rounded-xl">
                <div>
                  <div className="text-xs font-black text-gray-500 uppercase">Thẻ đến hạn</div>
                  <div className="text-2xl font-black text-brand-teal">0 thẻ</div>
                </div>
                <div>
                  <div className="text-xs font-black text-gray-500 uppercase">Trạng thái</div>
                  <div className="text-2xl font-black text-green-600">Đã thuộc</div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={() => {
                    setSearchParams({ mode: 'cram' });
                  }}
                  className="brutal-pill font-black h-14 !bg-[#F05A4A] text-white border border-[var(--border)] text-base w-full transition-transform hover:-translate-y-1 shadow-[var(--shadow-sm)] cursor-pointer"
                >
                  Ôn tập tự do toàn bộ bộ thẻ này
                </Button>
                <Button
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['deck-enrollments'] });
                    queryClient.invalidateQueries({ queryKey: ['study-progress', deckId] });
                    navigate('/my-decks');
                  }}
                  className="brutal-pill font-black h-12 bg-white text-brand-navy border border-[var(--border)] text-base w-full transition-transform hover:-translate-y-1 cursor-pointer"
                >
                  Quay lại Bộ Thẻ
                </Button>
                <Button
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['deck-enrollments'] });
                    queryClient.invalidateQueries({ queryKey: ['daily-activity', 'today'] });
                    queryClient.invalidateQueries({ queryKey: ['study-progress', deckId] });
                    navigate('/dashboard');
                  }}
                  className="brutal-pill font-black h-12 bg-[#2B1B0E] text-white border border-[var(--border)] text-base w-full transition-transform hover:-translate-y-1 cursor-pointer"
                >
                  Về Tổng Quan
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-4xl font-black mb-2 text-brand-navy">Hoàn thành!</h2>
              <p className="mb-8 font-bold text-gray-600 text-lg">
                {isCramMode
                  ? 'Bạn đã ôn tập xong toàn bộ thẻ trong chế độ tự do.'
                  : 'Bạn đã học xong tất cả thẻ đến hạn hôm nay.'}
              </p>

              <div className="bg-[#F4F3EE] border border-[var(--border)] p-4 mb-8 flex justify-around rounded-xl">
                <div>
                  <div className="text-sm font-black text-gray-500">Lượt ôn tập</div>
                  <div className="text-3xl font-black text-brand-teal">{sessionStats.reviewed}</div>
                </div>
                <div>
                  <div className="text-sm font-black text-gray-500">XP Nhận được</div>
                  <div className="text-3xl font-black text-brand-coral">+{sessionStats.newGainedXp}</div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {isCramMode && (
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={restartSession}
                    className="brutal-pill font-black h-12 !bg-[#2A8B9D] text-white border border-[var(--border)] text-base w-full transition-transform hover:-translate-y-1 cursor-pointer"
                  >
                    Ôn lại một lần nữa
                  </Button>
                )}
                <Button
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['deck-enrollments'] });
                    queryClient.invalidateQueries({ queryKey: ['study-progress', deckId] });
                    navigate('/my-decks');
                  }}
                  className="brutal-pill font-black h-12 bg-white text-brand-navy border border-[var(--border)] text-base w-full transition-transform hover:-translate-y-1 cursor-pointer"
                >
                  Quay lại Bộ Thẻ
                </Button>
                <Button
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['deck-enrollments'] });
                    queryClient.invalidateQueries({ queryKey: ['daily-activity', 'today'] });
                    queryClient.invalidateQueries({ queryKey: ['study-progress', deckId] });
                    navigate('/dashboard');
                  }}
                  className="brutal-pill font-black h-12 bg-[#2B1B0E] text-white border border-[var(--border)] text-base w-full transition-transform hover:-translate-y-1 cursor-pointer"
                >
                  Về Tổng Quan
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  const labels = getButtonLabels();



  return (
    <div className="min-h-screen bg-[#F4F3EE] flex flex-col items-center pt-6 md:pt-12 p-4 pb-12 font-sans">
      <div className="w-full max-w-xl md:max-w-2xl">
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['deck-enrollments'] });
              queryClient.invalidateQueries({ queryKey: ['daily-activity', 'today'] });
              queryClient.invalidateQueries({ queryKey: ['study-progress', deckId] });
              navigate('/my-decks');
            }}
            className="brutal-pill bg-white hover:bg-gray-100 font-black px-5 py-2 text-sm flex items-center gap-2 cursor-pointer transition-colors border border-[var(--border)] shadow-[var(--shadow-sm)]"
          >
            &larr; THOÁT
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {isCramMode && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-xs sm:text-sm font-black shadow-[var(--shadow-sm)]">
                <ThunderboltOutlined className="text-amber-600" />
                <span>Chế độ Ôn tập tự do</span>
              </div>
            )}
            <div className="font-black text-sm md:text-base bg-white px-4 py-1.5 border border-[var(--border)] shadow-[var(--shadow-sm)] rounded-xl text-[#2B1B0E]">
              Còn lại: <span className="text-[#F05A4A]">{studyQueue.length}</span> thẻ
            </div>
          </div>
        </div>

        {/* Flashcard Box */}
        <div className="w-full mb-6">
          <FlipCard
            card={currentCard}
            showBack={showBack}
            onFlip={() => setShowBack(!showBack)}
            onPlayAudio={handleSpeak}
          />
        </div>

        {/* Action Controls: Mặt trước hiển thị nút Xem Đáp Án, Mặt sau hiển thị 4 nút SM-2 */}
        {!showBack ? (
          <div className="w-full animate-fade-in">
            <button
              type="button"
              onClick={() => setShowBack(true)}
              className="w-full h-14 sm:h-16 bg-[#181E24] hover:bg-black active:translate-y-0.5 text-white text-base sm:text-lg font-black rounded-2xl border-2 border-black shadow-[5px_5px_0px_#000] active:shadow-none flex items-center justify-center gap-3 cursor-pointer transition-all hover:-translate-y-0.5"
            >
              <span>Xem Đáp Án / Lật Thẻ</span>
              <span className="text-xs sm:text-sm font-bold bg-white/20 text-white px-2.5 py-1 rounded-lg border border-white/30 tracking-wider">
                Phím Space
              </span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
            <button
              type="button"
              onClick={() => handleNext(1)}
              className="h-[84px] border-2 border-black rounded-2xl bg-[#ffcccc] hover:bg-[#ffb3b3] active:translate-y-0.5 text-[#cc0000] flex flex-col justify-center items-center transition-all cursor-pointer shadow-[4px_4px_0px_#000] active:shadow-none"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black">LẠI</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10">[1]</span>
              </div>
              <div className="text-xs font-bold opacity-80 mt-0.5">{labels.again}</div>
            </button>

            <button
              type="button"
              onClick={() => handleNext(2)}
              className="h-[84px] border-2 border-black rounded-2xl bg-[#ffe6cc] hover:bg-[#ffd9b3] active:translate-y-0.5 text-[#cc6600] flex flex-col justify-center items-center transition-all cursor-pointer shadow-[4px_4px_0px_#000] active:shadow-none"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black">KHÓ</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10">[2]</span>
              </div>
              <div className="text-xs font-bold opacity-80 mt-0.5">{labels.hard}</div>
            </button>

            <button
              type="button"
              onClick={() => handleNext(3)}
              className="h-[84px] border-2 border-black rounded-2xl bg-[#ccffcc] hover:bg-[#b3ffb3] active:translate-y-0.5 text-[#009900] flex flex-col justify-center items-center transition-all cursor-pointer shadow-[4px_4px_0px_#000] active:shadow-none"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black">TỐT</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10">[3]</span>
              </div>
              <div className="text-xs font-bold opacity-80 mt-0.5">{labels.good}</div>
            </button>

            <button
              type="button"
              onClick={() => handleNext(4)}
              className="h-[84px] border-2 border-black rounded-2xl bg-[#cce5ff] hover:bg-[#b3d9ff] active:translate-y-0.5 text-[#0066cc] flex flex-col justify-center items-center transition-all cursor-pointer shadow-[4px_4px_0px_#000] active:shadow-none"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black">DỄ</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10">[4]</span>
              </div>
              <div className="text-xs font-bold opacity-80 mt-0.5">{labels.easy}</div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
