import React, { useState } from 'react';
import { SoundOutlined, SwapOutlined } from '@ant-design/icons';

export interface VocabCardProps {
  word: string;
  phonetic?: string;
  meaning?: string;
  partOfSpeech?: string;
  exampleText?: string;
  exampleTranslation?: string;
  audioUrl?: string;
  interactive?: boolean;
  className?: string;
  rotateDeg?: number;
}

export const VocabCard: React.FC<VocabCardProps> = ({
  word,
  phonetic,
  meaning = 'Đang tải nghĩa...',
  partOfSpeech,
  exampleText,
  exampleTranslation,
  audioUrl,
  interactive = true,
  className = '',
  rotateDeg = -2,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        fallbackSpeech();
      };
      audio.play().catch(() => fallbackSpeech());
    } else {
      fallbackSpeech();
    }
  };

  const fallbackSpeech = () => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(false);
    }
  };

  // Highlight word in example text
  const renderExample = (text?: string) => {
    if (!text) return null;
    if (!word) return text;

    const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <span
              key={index}
              className="bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold px-1 rounded"
            >
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div
      className={`flip-card-container w-full max-w-[320px] min-w-0 [overflow-wrap:anywhere] h-[210px] select-none transition-transform duration-300 hover:scale-[1.02] ${className}`}
      style={{
        transform: rotateDeg ? `rotate(${rotateDeg}deg)` : undefined,
      }}
    >
      <div
        className={`flip-card-inner vocab-card-folded h-full cursor-pointer min-w-0 ${
          isFlipped ? 'flipped' : ''
        }`}
        onClick={() => interactive && setIsFlipped(!isFlipped)}
      >
        {/* FRONT */}
        <div className="flip-card-front p-5 flex flex-col justify-between bg-[var(--surface)] min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--text-3)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full">
              {partOfSpeech || 'TOEIC Vocabulary'}
            </span>
            <button
              type="button"
              onClick={handlePlayAudio}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isPlaying
                  ? 'bg-[var(--brand)] text-white scale-110 shadow-sm'
                  : 'bg-[var(--brand-50)] text-[var(--brand-700)] hover:bg-[var(--brand)] hover:text-white'
              }`}
              title="Phát âm chuẩn IPA"
              aria-label="Phát âm"
            >
              <SoundOutlined className="text-base" />
            </button>
          </div>

          <div className="my-auto text-center py-2 min-w-0">
            <h3 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)] tracking-tight [overflow-wrap:anywhere] break-normal">
              {word}
            </h3>
            {phonetic && (
              <span className="text-sm font-ipa text-[var(--text-3)] mt-1 inline-block">
                {phonetic}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs text-[var(--text-3)]">
            <span>Bấm để xem nghĩa</span>
            <span className="inline-flex items-center gap-1 text-[var(--brand)] font-medium">
              <SwapOutlined /> Lật thẻ
            </span>
          </div>
        </div>

        {/* BACK */}
        <div className="flip-card-back p-5 flex flex-col justify-between bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] min-w-0 [overflow-wrap:anywhere]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--brand-700)]">
                {word}
              </span>
              <span className="text-[11px] text-[var(--text-3)]">
                {partOfSpeech || 'Từ vựng'}
              </span>
            </div>

            <p className="text-base font-semibold text-[var(--text)] mb-2 leading-snug">
              {meaning}
            </p>

            {exampleText && (
              <div className="p-2.5 bg-[var(--surface-2)] rounded-[12px] text-xs text-[var(--text-2)] leading-relaxed mt-1">
                <p className="italic">{renderExample(exampleText)}</p>
                {exampleTranslation && (
                  <p className="text-[11px] text-[var(--text-3)] mt-1 not-italic">
                    {exampleTranslation}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs text-[var(--text-3)]">
            <span>Chạm để quay lại</span>
            <span className="inline-flex items-center gap-1 text-[var(--brand)] font-medium">
              <SwapOutlined /> Lật lại
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
