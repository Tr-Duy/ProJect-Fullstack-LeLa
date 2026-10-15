import React, { useState } from 'react';
import { Volume2, Compass, CheckCircle2 } from 'lucide-react';
import { SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface Props {
  playSound?: () => void;
}

export function FlashcardDemo({ playSound }: Props) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const demoCards = [
    {
      word: 'Apple',
      ipa: '/ˈæp.əl/',
      meaning: 'Quả táo',
      example: 'An apple a day keeps the doctor away.',
      topic: 'TRÁI CÂY (FRUITS)',
    },
    {
      word: 'Opportunity',
      ipa: '/ˌɒp.əˈtʃuː.nə.ti/',
      meaning: 'Cơ hội, thời cơ',
      example: 'Don’t miss this great opportunity to learn.',
      topic: 'CÔNG VIỆC (WORK)',
    },
    {
      word: 'Destination',
      ipa: '/ˌdes.tɪˈneɪ.ʃən/',
      meaning: 'Điểm đến, nơi đến',
      example: 'Paris is our final travel destination.',
      topic: 'DU LỊCH (TRAVEL)',
    },
  ];

  const currentCard = demoCards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (playSound) playSound();
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % demoCards.length);
    if (playSound) playSound();
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + demoCards.length) % demoCards.length);
    if (playSound) playSound();
  };

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech synthesis not permitted or unsupported
      }
    }
  };

  return (
    <section className="w-full py-20 bg-white border-b-2 border-black">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Text */}
          <div className="flex flex-col items-start gap-6">
            <span className="inline-block bg-[#0D9488] text-white font-black uppercase text-xs px-4 py-1.5 rounded-full border-2 border-black shadow-[3px_3px_0px_#000]">
              TRẢI NGHIỆM THỰC TẾ
            </span>

            <h2 className="text-3xl md:text-5xl font-black uppercase text-[#18181B] tracking-tight leading-tight">
              Học Thử Ngay Không Cần Đăng Nhập
            </h2>

            <p className="text-base md:text-lg font-medium text-gray-700 leading-relaxed">
              Trải nghiệm cách thẻ Flashcard LeLa hoạt động. Nhấp trực tiếp vào mặt thẻ để lật xem nghĩa tiếng Việt và ví dụ câu minh họa.
            </p>

            <div className="p-4 bg-[#F5F0E8] rounded-xl border border-black/20 w-full space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#18181B]">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>Phát âm chuẩn tiếng Anh bản xứ</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-[#18181B]">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>Ví dụ câu thực tế dễ ghi nhớ</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-[#18181B]">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>Tự do xem hàng ngàn bộ thẻ miễn phí</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => navigate('/decks')}
                className="bg-[#FF5733] hover:bg-[#ea4a27] text-white font-black uppercase h-12 px-8 text-base rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 cursor-pointer"
              >
                <Compass className="w-5 h-5" />
                <span>Khám Phá Tất Cả Bộ Thẻ</span>
              </button>
            </div>
          </div>

          {/* Right Flashcard Box */}
          <div className="flex flex-col items-center gap-4">
            <div
              onClick={handleFlip}
              className="w-full max-w-[420px] h-[310px] bg-white border-2 border-black rounded-2xl p-8 shadow-[5px_5px_0px_0px_#000] flex flex-col justify-between cursor-pointer relative hover:-translate-y-1 transition-transform select-none"
            >
              {/* Header inside Card */}
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase bg-[#FDE047] text-black px-3 py-1 rounded-full border border-black">
                  {currentCard.topic}
                </span>

                <button
                  type="button"
                  onClick={(e) => handleSpeak(e, currentCard.word)}
                  aria-label="Phát âm từ vựng"
                  className="p-1.5 hover:bg-gray-100 rounded-full border border-black shadow-[1px_1px_0px_#000] transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-[#0D9488]" />
                </button>
              </div>

              {/* Card Center Content */}
              {!isFlipped ? (
                <div className="text-center my-auto flex flex-col gap-2">
                  <h3 className="text-4xl font-black text-[#18181B] m-0 tracking-tight">
                    {currentCard.word}
                  </h3>
                  <span className="text-sm font-bold text-gray-600 font-mono">
                    {currentCard.ipa}
                  </span>
                  <span className="text-xs font-bold text-green-600 mt-2 block">
                    (Nhấp vào thẻ để xem nghĩa)
                  </span>
                </div>
              ) : (
                <div className="text-center my-auto flex flex-col gap-2">
                  <h3 className="text-3xl font-black text-[#FF5733] m-0 tracking-tight">
                    {currentCard.meaning}
                  </h3>
                  <p className="text-xs md:text-sm font-semibold text-gray-700 italic m-0 mt-2 bg-[#FDFBF7] p-3 rounded-xl border border-black">
                    "{currentCard.example}"
                  </p>
                </div>
              )}

              {/* Card Footer Hint */}
              <div className="flex justify-center items-center gap-2 text-xs font-bold text-gray-500 border-t border-black/10 pt-3">
                <SwapOutlined />
                <span>{isFlipped ? 'Nhấp để xem từ tiếng Anh' : 'Nhấp để lật bản dịch'}</span>
              </div>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={handlePrev}
                className="border border-black rounded-full px-4 py-1.5 shadow-[2px_2px_0px_#000] bg-white font-bold text-sm text-[#18181B] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
              >
                &lt; Trước
              </button>
              <span className="font-black text-sm text-[#18181B] px-2">
                {currentIndex + 1} / {demoCards.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="border border-black rounded-full px-4 py-1.5 shadow-[2px_2px_0px_#000] bg-white font-bold text-sm text-[#18181B] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
              >
                Tiếp &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default FlashcardDemo;
