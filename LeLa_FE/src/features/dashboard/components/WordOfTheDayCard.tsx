import React, { useState } from 'react';
import { SoundOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { FlashcardResponse } from '../../../shared/types/lela';

interface WordOfTheDayCardProps {
  card?: FlashcardResponse | null;
  onExplore?: () => void;
}

export const WordOfTheDayCard: React.FC<WordOfTheDayCardProps> = ({ card, onExplore }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!card) return null;

  const word = card.frontText;
  const phonetic = card.phonetic;
  const meaning = card.backText;
  const partOfSpeech = card.partOfSpeech || 'noun';
  const exampleText = card.exampleText;
  const exampleTranslation = card.exampleTranslation;
  const audioUrl = card.frontAudioUrl;

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => fallbackSpeech();
      audio.play().catch(() => fallbackSpeech());
    } else {
      fallbackSpeech();
    }
  };

  const fallbackSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
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
              className="bg-[var(--sun-100)] text-[var(--brand-700)] font-semibold px-1 rounded"
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
    <div className="bg-[var(--surface)] rounded-[20px] p-6 border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--sun-100)] text-[var(--text)] text-xs font-semibold">
          <svg className="w-3.5 h-3.5 text-[var(--brand-700)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
          <span>Từ của hôm nay</span>
        </div>
        <span className="text-[11px] font-medium text-[var(--text-3)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full">
          {partOfSpeech}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-[var(--text)] tracking-tight">
            {word}
          </h3>
          {phonetic && (
            <span className="font-ipa text-sm text-[var(--text-3)]">
              {phonetic}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handlePlayAudio}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            isPlaying
              ? 'bg-[var(--brand)] text-[#2A1300] scale-110 shadow-sm'
              : 'bg-[var(--brand-50)] text-[var(--brand-700)] hover:bg-[var(--brand)] hover:text-[#2A1300]'
          }`}
          title="Phát âm chuẩn IPA"
          aria-label="Phát âm từ"
        >
          <SoundOutlined className="text-base" />
        </button>
      </div>

      <p className="mt-2 text-base font-semibold text-[var(--brand-700)]">
        {meaning}
      </p>

      {exampleText && (
        <div className="mt-3 p-3.5 rounded-[14px] bg-[var(--surface-2)]/70 border border-[var(--border)] space-y-1 text-xs sm:text-sm">
          <p className="text-[var(--text)] leading-relaxed italic">
            "{renderExample(exampleText)}"
          </p>
          {exampleTranslation && (
            <p className="text-[var(--text-3)] text-xs">
              {exampleTranslation}
            </p>
          )}
        </div>
      )}

      {onExplore && (
        <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-end">
          <button
            type="button"
            onClick={onExplore}
            className="text-xs font-semibold text-[var(--brand-700)] hover:text-[var(--brand)] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Xem chi tiết bộ thẻ</span>
            <ArrowRightOutlined className="text-[10px]" />
          </button>
        </div>
      )}
    </div>
  );
};

export default WordOfTheDayCard;
