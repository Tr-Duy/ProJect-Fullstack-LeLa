import React, { useState } from 'react';
import { Button } from 'antd';
import { Volume2, Compass } from 'lucide-react';
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
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <section className="w-full py-20 bg-white border-b-[3px] border-black">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Text */}
          <div className="flex flex-col items-start gap-6">
            <span className="inline-block bg-[#2A8B9D] text-white font-black uppercase text-xs px-4 py-1.5 rounded-full border-[2px] border-black shadow-[2px_2px_0px_0px_#000]">
              TRẢI NGHIỆM THỰC TẾ
            </span>

            <h2 className="text-3xl md:text-5xl font-black uppercase text-[#1D2A3A] tracking-tight leading-tight">
              Học Thử Ngay Không Cần Đăng Nhập
            </h2>

            <p className="text-base md:text-lg font-medium text-gray-700 leading-relaxed">
              Trải nghiệm cách thẻ Flashcard LeLa hoạt động. Nhấp trực tiếp vào mặt thẻ để lật xem nghĩa tiếng Việt và ví dụ câu minh họa.
            </p>

            <div className="p-4 bg-[#F4F3EE] rounded-2xl border-[2px] border-black w-full space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1D2A3A]">
                <span className="text-green-600">✓</span> <span>Phát âm chuẩn tiếng Anh bản xứ</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-[#1D2A3A]">
                <span className="text-green-600">✓</span> <span>Ví dụ câu thực tế dễ ghi nhớ</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-[#1D2A3A]">
                <span className="text-green-600">✓</span> <span>Tự do xem hàng ngàn bộ thẻ miễn phí</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <Button
                onClick={() => navigate('/decks')}
                className="brutal-pill border-[2px] border-black font-black uppercase text-white bg-[#F05A4A] hover:!bg-[#d94f41] h-12 px-8 text-base shadow-[3px_3px_0px_0px_#000] flex items-center gap-2"
              >
                <Compass className="w-5 h-5" />
                <span>Khám Phá Tất Cả Bộ Thẻ</span>
              </Button>
            </div>
          </div>

          {/* Right Flashcard Box */}
          <div className="flex flex-col items-center gap-4">
            <div
              onClick={handleFlip}
              className="w-full max-w-[400px] h-[300px] bg-[#F4F3EE] border-[3px] border-black rounded-[24px] shadow-[6px_6px_0px_0px_#000] p-8 flex flex-col justify-between cursor-pointer relative hover:-translate-y-1 transition-transform select-none"
            >
              {/* Header inside Card */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase bg-[#FFD700] text-black px-3 py-1 rounded-full border-[1px] border-black">
                  {currentCard.topic}
                </span>

                <Button
                  type="text"
                  onClick={(e) => handleSpeak(e, currentCard.word)}
                  icon={<Volume2 className="w-5 h-5 text-[#2A8B9D]" />}
                  className="p-1 hover:bg-white rounded-full"
                />
              </div>

              {/* Card Center Content */}
              {!isFlipped ? (
                <div className="text-center my-auto flex flex-col gap-2">
                  <h3 className="text-4xl font-black text-[#1D2A3A] m-0 tracking-tight">
                    {currentCard.word}
                  </h3>
                  <span className="text-sm font-bold text-gray-500 font-mono">
                    {currentCard.ipa}
                  </span>
                  <span className="text-xs font-bold text-[#2A8B9D] mt-2 block">
                    (Nhấp vào thẻ để xem nghĩa)
                  </span>
                </div>
              ) : (
                <div className="text-center my-auto flex flex-col gap-2">
                  <h3 className="text-3xl font-black text-[#F05A4A] m-0 tracking-tight">
                    {currentCard.meaning}
                  </h3>
                  <p className="text-xs md:text-sm font-semibold text-gray-700 italic m-0 mt-2 bg-white p-3 rounded-xl border-[1px] border-black">
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
            <div className="flex items-center gap-4 mt-2">
              <Button
                onClick={handlePrev}
                className="brutal-pill border-[2px] border-black font-bold bg-white text-black h-10 px-4 shadow-[2px_2px_0px_0px_#000]"
              >
                ◄ Trước
              </Button>
              <span className="font-black text-sm text-[#1D2A3A]">
                {currentIndex + 1} / {demoCards.length}
              </span>
              <Button
                onClick={handleNext}
                className="brutal-pill border-[2px] border-black font-bold bg-white text-black h-10 px-4 shadow-[2px_2px_0px_0px_#000]"
              >
                Tiếp ►
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
