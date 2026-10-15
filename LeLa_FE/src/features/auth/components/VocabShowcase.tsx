import React, { useState, useEffect, useCallback } from 'react';
import { SoundOutlined, SwapOutlined, CheckCircleFilled, ThunderboltFilled } from '@ant-design/icons';
import { Lela, type LelaMood } from '../../../shared/components/ui/Lela';

export interface ShowcaseWord {
  word: string;
  ipa: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  translation: string;
}

export const SHOWCASE_WORDS: ShowcaseWord[] = [
  {
    word: 'appointment',
    ipa: '/əˈpɔɪnt.mənt/',
    partOfSpeech: 'noun',
    meaning: 'cuộc hẹn, buổi gặp đã xếp trước',
    example: 'I have an appointment with the sales director at 2 PM.',
    translation: 'Tôi có một cuộc hẹn với giám đốc kinh doanh lúc 2 giờ chiều.',
  },
  {
    word: 'negotiate',
    ipa: '/nəˈɡoʊ.ʃi.eɪt/',
    partOfSpeech: 'verb',
    meaning: 'đàm phán, thương thảo hợp đồng',
    example: 'Both companies are trying to negotiate better contract terms.',
    translation: 'Cả hai công ty đang nỗ lực đàm phán các điều khoản hợp đồng tốt hơn.',
  },
  {
    word: 'itinerary',
    ipa: '/aɪˈtɪn.ə.rer.i/',
    partOfSpeech: 'noun',
    meaning: 'lịch trình chi tiết chuyến công tác',
    example: 'The assistant prepared a detailed business trip itinerary.',
    translation: 'Trợ lý đã chuẩn bị lịch trình chi tiết cho chuyến công tác.',
  },
  {
    word: 'invoice',
    ipa: '/ˈɪn.vɔɪs/',
    partOfSpeech: 'noun',
    meaning: 'hóa đơn bán hàng và thanh toán',
    example: 'Payment is due within 30 days after receiving the invoice.',
    translation: 'Khoản thanh toán đến hạn trong vòng 30 ngày sau khi nhận hóa đơn.',
  },
  {
    word: 'deadline',
    ipa: '/ˈded.laɪn/',
    partOfSpeech: 'noun',
    meaning: 'hạn chót hoàn thành nhiệm vụ',
    example: 'Our marketing team worked diligently to meet the strict deadline.',
    translation: 'Nhóm tiếp thị của chúng tôi đã làm việc chăm chỉ để kịp hạn chót.',
  },
  {
    word: 'reservation',
    ipa: '/ˌrez.ɚˈveɪ.ʃən/',
    partOfSpeech: 'noun',
    meaning: 'sự đặt chỗ trước (phòng, vé)',
    example: 'Please confirm our hotel reservation before departure.',
    translation: 'Vui lòng xác nhận việc đặt phòng khách sạn trước khi khởi hành.',
  },
];

interface VocabShowcaseProps {
  lelaMood?: LelaMood;
  lelaPupilOffset?: number;
}

export const VocabShowcase: React.FC<VocabShowcaseProps> = ({
  lelaMood = 'idle',
  lelaPupilOffset = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Auto-rotate every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIsFlipped(false);
      setCurrentIndex((prev) => (prev + 1) % SHOWCASE_WORDS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const currentWord = SHOWCASE_WORDS[currentIndex];

  const handlePlayAudio = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingAudio) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsPlayingAudio(true);
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [currentWord.word, isPlayingAudio]);

  const renderExample = (text: string, keyword: string) => {
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-[var(--sun-100)] text-[var(--brand-700)] font-bold px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none">
      {/* 3D Tilted Vocabulary Card (-3 deg) */}
      <div className="w-full relative px-4">
        {/* Lela Mascot Standing Alongside */}
        <div className="absolute -top-12 -right-2 sm:-right-4 z-20 flex flex-col items-center">
          <div className="bg-white px-3 py-1.5 rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--border)] text-xs font-semibold text-[var(--brand-700)] mb-1 whitespace-nowrap">
            {lelaMood === 'cover' ? 'Che mắt nè!' : lelaMood === 'peek' ? 'Hé nhìn nha!' : lelaMood === 'sad' ? 'Thử lại nhé!' : lelaMood === 'cheer' ? 'Chào mừng bạn!' : 'Học cùng LeLa!'}
          </div>
          <Lela mood={lelaMood} size={84} pupilOffset={lelaPupilOffset} />
        </div>

        <div
          className="flip-card-container w-full h-[240px] cursor-pointer"
          style={{ transform: 'rotate(-3deg)' }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`flip-card-inner h-full transition-transform duration-500 rounded-[24px] shadow-[var(--shadow-md)] ${isFlipped ? 'flipped' : ''}`}>
            {/* FRONT SIDE */}
            <div className="flip-card-front bg-white p-6 rounded-[24px] border border-[var(--border)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)]">
                  {currentWord.partOfSpeech}
                </span>

                <button
                  type="button"
                  onClick={handlePlayAudio}
                  aria-label="Phát âm tiếng Anh"
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-[var(--brand)] text-[#2A1300] scale-110'
                      : 'bg-[var(--surface-2)] text-[var(--brand-700)] hover:bg-[var(--brand)] hover:text-[#2A1300]'
                  }`}
                >
                  <SoundOutlined className="text-base" />
                </button>
              </div>

              <div className="text-center my-auto">
                <h3 className="font-display font-bold text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
                  {currentWord.word}
                </h3>
                <span className="font-ipa text-base text-[var(--text-3)] mt-1.5 inline-block">
                  {currentWord.ipa}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs text-[var(--text-3)]">
                <span>Chạm để xem nghĩa</span>
                <span className="inline-flex items-center gap-1 text-[var(--brand-700)] font-semibold">
                  <SwapOutlined /> Lật thẻ
                </span>
              </div>
            </div>

            {/* BACK SIDE */}
            <div className="flip-card-back bg-white p-6 rounded-[24px] border border-[var(--border)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-lg text-[var(--brand-700)]">
                    {currentWord.word}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-3)]">
                    {currentWord.partOfSpeech}
                  </span>
                </div>

                <p className="text-base font-semibold text-[var(--text)] mb-3 leading-snug">
                  {currentWord.meaning}
                </p>

                <div className="p-3 bg-[var(--surface-2)] rounded-[14px] text-xs leading-relaxed border border-[var(--border)]/50">
                  <p className="text-[var(--text)] italic">
                    {renderExample(currentWord.example, currentWord.word)}
                  </p>
                  <p className="text-[var(--text-2)] mt-1.5 not-italic text-[11px]">
                    {currentWord.translation}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs text-[var(--text-3)]">
                <span>Chạm để quay lại</span>
                <span className="inline-flex items-center gap-1 text-[var(--brand-700)] font-semibold">
                  <SwapOutlined /> Mặt trước
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dot indicators for 6 words */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {SHOWCASE_WORDS.map((w, idx) => (
            <button
              key={w.word}
              type="button"
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex(idx);
              }}
              aria-label={`Từ vựng: ${w.word}`}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                currentIndex === idx
                  ? 'w-7 bg-[var(--brand)]'
                  : 'w-2.5 bg-[var(--brand-100)] hover:bg-[var(--brand)]/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 3 Core Benefits with Icons */}
      <div className="w-full mt-8 space-y-3 px-4">
        <div className="flex items-center gap-3 p-3 rounded-[16px] bg-white/70 border border-[var(--border)] shadow-[var(--shadow-sm)]">
          <div className="w-9 h-9 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] flex items-center justify-center text-base shrink-0">
            <CheckCircleFilled className="text-[var(--brand)]" />
          </div>
          <div>
            <span className="font-semibold text-xs sm:text-sm text-[var(--text)]">Ôn đúng lúc bạn sắp quên</span>
            <p className="text-[11px] text-[var(--text-2)]">Lặp lại ngắt quãng SM-2 tối ưu hóa trí nhớ dài hạn.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-[16px] bg-white/70 border border-[var(--border)] shadow-[var(--shadow-sm)]">
          <div className="w-9 h-9 rounded-full bg-[var(--teal-50)] text-[var(--teal)] flex items-center justify-center text-base shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-xs sm:text-sm text-[var(--text)]">Luyện nói với AI theo đúng từ bạn học</span>
            <p className="text-[11px] text-[var(--text-2)]">Phản xạ hội thoại tình huống tự nhiên và chuẩn xác.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-[16px] bg-white/70 border border-[var(--border)] shadow-[var(--shadow-sm)]">
          <div className="w-9 h-9 rounded-full bg-[var(--sun-100)] text-[var(--brand-700)] flex items-center justify-center text-base shrink-0">
            <ThunderboltFilled className="text-[var(--sun)]" />
          </div>
          <div>
            <span className="font-semibold text-xs sm:text-sm text-[var(--text)]">Giữ chuỗi ngày, nhận XP và huy hiệu</span>
            <p className="text-[11px] text-[var(--text-2)]">Tạo động lực học tập bền bỉ mỗi ngày như chơi game.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
