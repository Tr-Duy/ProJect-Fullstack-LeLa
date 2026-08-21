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

  const formatPhonetic = (phonetic?: string) => {
    if (!phonetic) return '';
    let p = phonetic.trim();
    if (!p.startsWith('/')) p = '/' + p;
    if (!p.endsWith('/')) p = p + '/';
    return p;
  };

  const getPosTag = (pos?: string, backText?: string) => {
    if (pos && pos.trim()) {
      const p = pos.trim().toLowerCase();
      if (p.includes('tính') || p.includes('adj')) return 'Adj';
      if (p.includes('danh') || p.includes('noun')) return 'Noun';
      if (p.includes('động') || p.includes('verb')) return 'Verb';
      if (p.includes('trạng') || p.includes('phó') || p.includes('adv')) return 'Adv';
      return pos;
    }
    if (backText) {
      const b = backText.toLowerCase();
      if (b.includes('tính') || b.includes('mới') || b.includes('đẹp') || b.includes('tốt')) return 'Adj';
      if (b.includes('động') || b.includes('chạy') || b.includes('học')) return 'Verb';
    }
    return 'Noun';
  };

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
            className="brutal-pill bg-white hover:bg-gray-100 font-black px-5 py-2 text-sm flex items-center gap-2 cursor-pointer transition-colors border-[2px] border-black shadow-[2px_2px_0px_0px_#000]"
          >
            &larr; THOÁT
          </button>

          <div className="flex items-center gap-3">
            <div className="font-black text-sm md:text-base bg-white px-4 py-1.5 border-[2px] border-black shadow-[2px_2px_0px_0px_#000] rounded-xl text-[#1D2A3A]">
              Còn lại: <span className="text-[#F05A4A]">{studyQueue.length}</span> thẻ
            </div>
          </div>
        </div>

        {/* Flashcard Box */}
        <div className="relative h-[500px] sm:h-[540px] w-full mb-6" style={{ perspective: 1000 }}>
          <motion.div
            key={currentCard.id}
            className="w-full h-full relative"
            style={{ transformStyle: 'preserve-3d' }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: showBack ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            onClick={() => setShowBack(!showBack)}
          >
            {/* FRONT CARD */}
            <div
              className={`absolute inset-0 bg-white rounded-[28px] border-[3px] border-black shadow-[0_10px_0_0_#cbd5e1] flex flex-col items-center justify-center p-8 cursor-pointer select-none transition-transform hover:-translate-y-1 ${
                showBack ? 'pointer-events-none' : ''
              }`}
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            >
              {/* Speaker Audio Button Top Right */}
              <button
                className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white hover:bg-gray-100 active:scale-95 border-[2px] border-black shadow-[2px_2px_0px_0px_#000] text-[#1D2A3A] rounded-full transition-all cursor-pointer z-20"
                onClick={(e) => handleSpeak(e, currentCard.frontText)}
                title="Nghe phát âm"
              >
                <SoundOutlined className="text-xl" />
              </button>

              {/* Word */}
              <div className="text-4xl sm:text-6xl font-black text-center text-[#1D2A3A] tracking-tight break-words w-full px-4 mb-2">
                {currentCard.frontText}
              </div>

              {/* IPA */}
              {currentCard.phonetic && (
                <div className="text-xl sm:text-2xl font-bold text-gray-500 tracking-wide mb-6">
                  {formatPhonetic(currentCard.phonetic)}
                </div>
              )}

              {/* Optional Front Image */}
              {currentCard.frontImageUrl && (
                <div className="w-full max-h-36 overflow-hidden rounded-2xl border-[2px] border-black mt-2">
                  <img src={currentCard.frontImageUrl} alt="Front Visual" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Bottom Flip Indicator */}
              <div className="absolute bottom-6 bg-[#1D2A3A] text-white px-6 py-2 rounded-full border-[2px] border-black font-black uppercase text-xs tracking-widest animate-pulse shadow-[2px_2px_0px_0px_#000]">
                [ NHẤN ĐỂ LẬT THẺ ]
              </div>
            </div>

            {/* BACK CARD */}
            <div
              className={`absolute inset-0 bg-white rounded-[28px] border-[3px] border-black shadow-[0_10px_0_0_#cbd5e1] flex flex-col p-6 sm:p-8 cursor-pointer select-none ${
                !showBack ? 'pointer-events-none' : ''
              }`}
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              {/* Speaker Audio Button Top Right */}
              <button
                className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white hover:bg-gray-100 active:scale-95 border-[2px] border-black shadow-[2px_2px_0px_0px_#000] text-[#1D2A3A] rounded-full transition-all cursor-pointer z-20"
                onClick={(e) => handleSpeak(e, currentCard.frontText)}
                title="Nghe phát âm"
              >
                <SoundOutlined className="text-xl" />
              </button>

              {/* Scrollable Container for Back Card Info */}
              <div className="flex-1 overflow-y-auto pr-2 text-left space-y-3.5 scrollbar-thin">
                {/* 1. Header: Word + IPA */}
                <div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F05A4A] tracking-tight leading-tight m-0 pr-14">
                    {currentCard.frontText}
                  </h2>
                  {currentCard.phonetic && (
                    <div className="text-lg sm:text-xl font-bold text-gray-400 mt-0.5">
                      {formatPhonetic(currentCard.phonetic)}
                    </div>
                  )}
                </div>

                {/* 2. Primary Meaning + POS Hint (Coral/Red Bold) */}
                <div className="text-2xl sm:text-3xl font-black text-[#D9381E] leading-tight pt-1">
                  {currentCard.backText} {`(${getPosTag(currentCard.partOfSpeech, currentCard.backText)})`}
                </div>

                {/* 3. Part of Speech Name (Dark Bold) */}
                <div className="text-base sm:text-lg font-black text-[#1D2A3A] uppercase tracking-wide">
                  {currentCard.partOfSpeech || 'Tính từ'}
                </div>

                {/* 4. Definition / Explanation (Coral/Red) */}
                {(currentCard.definition || currentCard.hint) && (
                  <div className="text-base sm:text-lg font-bold text-[#D9381E] leading-relaxed">
                    {currentCard.definition || currentCard.hint}
                  </div>
                )}

                {/* 5. Example Sentence (English - Bright Blue) */}
                {currentCard.exampleText && (
                  <div className="text-base sm:text-lg font-bold text-[#007AFF] leading-snug pt-1">
                    {currentCard.exampleText}
                  </div>
                )}

                {/* 6. Example Translation (Vietnamese - Dark Gray) */}
                {currentCard.exampleTranslation && (
                  <div className="text-base font-medium text-[#2D3748] leading-snug">
                    {currentCard.exampleTranslation}
                  </div>
                )}

                {/* 7. Related Words Section */}
                {currentCard.relatedWords && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">
                      TỪ LIÊN QUAN
                    </div>
                    <div className="text-sm font-bold text-gray-600 leading-normal">
                      {currentCard.relatedWords}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Spaced Repetition Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
          <button
            onClick={() => handleNext(1)}
            className="h-[84px] border-[2px] border-black rounded-2xl bg-[#ffcccc] hover:bg-[#ffb3b3] active:translate-y-1 active:shadow-[1px_1px_0px_0px_#000] text-[#cc0000] flex flex-col justify-center items-center transition-all cursor-pointer shadow-[3px_3px_0px_0px_#000]"
          >
            <div className="text-xl font-black">LẠI</div>
            <div className="text-xs font-bold opacity-80 mt-0.5">{labels.again}</div>
          </button>
          <button
            onClick={() => handleNext(2)}
            className="h-[84px] border-[2px] border-black rounded-2xl bg-[#ffe6cc] hover:bg-[#ffd9b3] active:translate-y-1 active:shadow-[1px_1px_0px_0px_#000] text-[#cc6600] flex flex-col justify-center items-center transition-all cursor-pointer shadow-[3px_3px_0px_0px_#000]"
          >
            <div className="text-xl font-black">KHÓ</div>
            <div className="text-xs font-bold opacity-80 mt-0.5">{labels.hard}</div>
          </button>
          <button
            onClick={() => handleNext(3)}
            className="h-[84px] border-[2px] border-black rounded-2xl bg-[#ccffcc] hover:bg-[#b3ffb3] active:translate-y-1 active:shadow-[1px_1px_0px_0px_#000] text-[#009900] flex flex-col justify-center items-center transition-all cursor-pointer shadow-[3px_3px_0px_0px_#000]"
          >
            <div className="text-xl font-black">TỐT</div>
            <div className="text-xs font-bold opacity-80 mt-0.5">{labels.good}</div>
          </button>
          <button
            onClick={() => handleNext(4)}
            className="h-[84px] border-[2px] border-black rounded-2xl bg-[#cce5ff] hover:bg-[#b3d9ff] active:translate-y-1 active:shadow-[1px_1px_0px_0px_#000] text-[#0066cc] flex flex-col justify-center items-center transition-all cursor-pointer shadow-[3px_3px_0px_0px_#000]"
          >
            <div className="text-xl font-black">DỄ</div>
            <div className="text-xs font-bold opacity-80 mt-0.5">{labels.easy}</div>
          </button>
        </div>
      </div>
    </div>
  );
}
