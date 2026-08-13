import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Skeleton } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import { useStudySession } from '../hooks/useStudySession';
import { motion } from 'motion/react';

export function StudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const {
    currentCard,
    isFinished,
    isLoading,
    sessionStats,
    handleReview,
    studyQueue
  } = useStudySession(deckId);

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

  const getButtonLabels = () => {
    // For ponytail simulation, we just return fixed labels
    // since we offloaded progressData to the hook
    return {
      again: '< 1m',
      hard: '5m',
      good: '10m',
      easy: '4d'
    };
  };

  if (isLoading || !isFinished && !currentCard) {
    return <div className="p-8 max-w-2xl mx-auto"><Skeleton active /></div>;
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#F4F3EE] p-8 flex items-center justify-center relative overflow-hidden">
        {/* Simple Confetti Effect via Framer Motion */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-3 h-3 rounded-sm ${['bg-[#F05A4A]', 'bg-[#2A8B9D]', 'bg-[#FFD700]', 'bg-brand-navy'][i % 4]} brutal-border`}
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
          className="max-w-md w-full text-center brutal-card bg-white p-10 brutal-shadow relative z-10"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-black mb-2 uppercase text-brand-navy">Hoàn thành!</h2>
          <p className="mb-8 font-bold text-gray-600 text-lg">Bạn đã học xong tất cả thẻ đến hạn hôm nay.</p>

          <div className="bg-[#F4F3EE] border-[3px] border-black p-4 mb-8 flex justify-around">
            <div>
              <div className="text-sm font-black uppercase text-gray-500">Lượt ôn tập</div>
              <div className="text-3xl font-black text-brand-teal">{sessionStats.reviewed}</div>
            </div>
            <div>
              <div className="text-sm font-black uppercase text-gray-500">XP Nhận được</div>
              <div className="text-3xl font-black text-brand-coral">+{sessionStats.newGainedXp}</div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['deck-enrollments'] });
              queryClient.invalidateQueries({ queryKey: ['study-progress', deckId] });
              navigate('/my-decks');
            }} className="brutal-pill font-black h-14 bg-white text-brand-navy brutal-border text-lg w-full transition-transform hover:-translate-y-1">
              Quay lại Bộ Thẻ
            </Button>
            <Button onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['deck-enrollments'] });
              queryClient.invalidateQueries({ queryKey: ['daily-activity', 'today'] });
              queryClient.invalidateQueries({ queryKey: ['study-progress', deckId] });
              navigate('/dashboard');
            }} className="brutal-pill font-black h-14 bg-brand-coral text-white brutal-border text-lg w-full transition-transform hover:-translate-y-1">
              Về Tổng Quan
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const labels = getButtonLabels();

  return (
    <div className="min-h-screen bg-[#F4F3EE] flex flex-col items-center pt-8 md:pt-16 p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['deck-enrollments'] });
              queryClient.invalidateQueries({ queryKey: ['daily-activity', 'today'] });
              queryClient.invalidateQueries({ queryKey: ['study-progress', deckId] });
              navigate('/my-decks');
            }}
            className="brutal-pill bg-white hover:bg-gray-100 font-bold px-6 py-2 flex items-center gap-2 cursor-pointer transition-colors"
          >
            &larr; THOÁT
          </button>

          <div className="flex gap-4">
            <div className="font-bold text-lg brutal-card bg-white px-4 py-1 border-[2px] shadow-[2px_2px_0px_0px_#000]">
              Còn lại: {studyQueue.length} thẻ
            </div>
          </div>
        </div>

        <div className="relative h-[450px] w-full mb-8" style={{ perspective: 1000 }}>
          <motion.div
            key={currentCard.id}
            className="w-full h-full relative"
            style={{ transformStyle: 'preserve-3d' }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: showBack ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setShowBack(!showBack)}
          >
            {/* FRONT */}
            <div
              className={`absolute inset-0 brutal-card bg-white flex flex-col items-center justify-center p-8 cursor-pointer border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform ${showBack ? 'pointer-events-none' : ''}`}
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            >
              <button
                className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center bg-[#2A8B9D] hover:bg-[#1D2A3A] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white rounded-full transition-all cursor-pointer z-10"
                onClick={(e) => handleSpeak(e, currentCard.frontText)}
              >
                <SoundOutlined className="text-xl" />
              </button>

              <div className="text-3xl md:text-5xl font-black text-center mb-4 text-[#1D2A3A] break-words w-full px-4">{currentCard.frontText}</div>

              {currentCard.phonetic && (
                <div className="text-xl md:text-2xl font-medium text-gray-500 mb-4">
                  /{currentCard.phonetic}/
                </div>
              )}

              {currentCard.frontImageUrl && (
                <div className="w-full max-h-40 overflow-hidden rounded-xl border-[3px] border-black mt-2">
                  <img src={currentCard.frontImageUrl} alt="Front Visual" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="absolute bottom-6 bg-[#1D2A3A] text-white px-6 py-2 border-[3px] border-black font-black uppercase text-sm tracking-widest animate-pulse">
                [ NHẤN ĐỂ LẬT THẺ ]
              </div>
            </div>

            {/* BACK */}
            <div
              className={`absolute inset-0 brutal-card bg-white flex flex-col items-center justify-center p-8 border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${!showBack ? 'pointer-events-none' : ''}`}
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <button
                className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center bg-[#2A8B9D] hover:bg-[#1D2A3A] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white rounded-full transition-all cursor-pointer z-10"
                onClick={(e) => handleSpeak(e, currentCard.frontText)}
              >
                <SoundOutlined className="text-xl" />
              </button>

              {currentCard.backImageUrl && (
                <div className="w-full max-w-[200px] max-h-32 mb-4 overflow-hidden rounded-xl border-[3px] border-black">
                  <img src={currentCard.backImageUrl} alt="Back Visual" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="text-2xl md:text-4xl font-black text-[#2A8B9D] mb-4 text-center break-words w-full px-4">{currentCard.backText}</div>

              {currentCard.exampleText && (
                <div className="text-xl italic font-medium text-gray-700 text-center bg-[#F4F3EE] p-4 border-[3px] border-black mt-2">
                  "{currentCard.exampleText}"
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <button
            onClick={() => handleNext(1)}
            className="h-[90px] brutal-border brutal-shadow rounded-2xl bg-[#ffcccc] hover:bg-[#ff9999] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] text-[#cc0000] flex flex-col justify-center items-center transition-all cursor-pointer"
          >
            <div className="text-2xl font-black">LẠI</div>
            <div className="text-sm font-bold opacity-80 mt-1">{labels.again}</div>
          </button>
          <button
            onClick={() => handleNext(2)}
            className="h-[90px] brutal-border brutal-shadow rounded-2xl bg-[#ffe6cc] hover:bg-[#ffcc99] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] text-[#cc6600] flex flex-col justify-center items-center transition-all cursor-pointer"
          >
            <div className="text-2xl font-black">KHÓ</div>
            <div className="text-sm font-bold opacity-80 mt-1">{labels.hard}</div>
          </button>
          <button
            onClick={() => handleNext(3)}
            className="h-[90px] brutal-border brutal-shadow rounded-2xl bg-[#ccffcc] hover:bg-[#99ff99] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] text-[#009900] flex flex-col justify-center items-center transition-all cursor-pointer"
          >
            <div className="text-2xl font-black">TỐT</div>
            <div className="text-sm font-bold opacity-80 mt-1">{labels.good}</div>
          </button>
          <button
            onClick={() => handleNext(4)}
            className="h-[90px] brutal-border brutal-shadow rounded-2xl bg-[#cce5ff] hover:bg-[#99ccff] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] text-[#0066cc] flex flex-col justify-center items-center transition-all cursor-pointer"
          >
            <div className="text-2xl font-black">DỄ</div>
            <div className="text-sm font-bold opacity-80 mt-1">{labels.easy}</div>
          </button>
        </div>
      </div>
    </div>
  );
}
