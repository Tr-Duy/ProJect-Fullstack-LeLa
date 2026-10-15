import React from 'react';
import { motion } from 'motion/react';
import { SoundOutlined } from '@ant-design/icons';
import type { FlashcardResponse } from '../../../shared/types/lela';

interface FlipCardProps {
  card: FlashcardResponse;
  showBack: boolean;
  onFlip: () => void;
  onPlayAudio?: (e: React.MouseEvent, text: string) => void;
  className?: string;
}

export const FlipCard: React.FC<FlipCardProps> = ({
  card,
  showBack,
  onFlip,
  onPlayAudio,
  className = '',
}) => {
  // Extract normalized fields with fallbacks
  const word = card.word || card.frontText || '';
  const vietnameseMeaning = card.vietnameseMeaning || card.backText || '';
  const exampleEn = card.exampleEn || card.exampleText;
  const exampleVi = card.exampleVi || card.exampleTranslation;
  const synonyms = card.synonyms && card.synonyms.length > 0 ? card.synonyms : [];
  const antonyms = card.antonyms && card.antonyms.length > 0 ? card.antonyms : [];

  // Normalize Part of Speech short code (v, n, adj, adv, phr)
  const getShortPos = (pos?: string): string => {
    if (!pos) return '';
    const p = pos.toLowerCase().trim();
    if (p.startsWith('(') && p.endsWith(')')) {
      return p.slice(1, -1).trim();
    }
    if (p === 'v' || p.startsWith('v.') || p.includes('verb') || p.includes('động')) return 'v';
    if (p === 'n' || p.startsWith('n.') || p.includes('noun') || p.includes('danh')) return 'n';
    if (p === 'adj' || p.startsWith('adj.') || p.includes('adjective') || p.includes('tính')) return 'adj';
    if (p === 'adv' || p.startsWith('adv.') || p.includes('adverb') || p.includes('trạng') || p.includes('phó')) return 'adv';
    if (p === 'phr' || p.startsWith('phr.') || p.includes('phrase') || p.includes('cụm')) return 'phr';
    if (p === 'prep' || p.startsWith('prep.') || p.includes('giới')) return 'prep';
    return p;
  };

  const shortPos = getShortPos(card.partOfSpeech);

  const formatPhonetic = (phonetic?: string): string => {
    if (!phonetic) return '';
    let p = phonetic.trim();
    if (!p.startsWith('/')) p = '/' + p;
    if (!p.endsWith('/')) p = p + '/';
    return p;
  };

  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlayAudio) {
      onPlayAudio(e, word);
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className={`relative w-full h-[400px] sm:h-[420px] cursor-pointer select-none ${className}`}
      style={{ perspective: 1000 }}
      onClick={onFlip}
    >
      <motion.div
        key={card.id}
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: showBack ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {/* ==================== MẶT TRƯỚC (CARD FRONT) ==================== */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center relative bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_#000] hover:-translate-y-0.5 transition-transform ${
            showBack ? 'pointer-events-none' : ''
          }`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {/* Nút Loa đặt góc trên bên phải gọn gàng */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playAudio(e);
            }}
            className="absolute top-5 right-5 p-2.5 rounded-full border border-black bg-white hover:bg-amber-100 active:scale-95 transition-all shadow-[2px_2px_0px_#000] cursor-pointer z-10"
            title="Nghe phát âm"
          >
            <SoundOutlined className="text-lg text-black" />
          </button>

          {/* Khối từ vựng chính cân đối ở giữa */}
          <div className="flex items-center justify-center flex-wrap gap-3 mb-3 max-w-[90%]">
            <h1 className="text-4xl sm:text-5xl font-black text-[#181E24] tracking-tight m-0">
              {word}
            </h1>
            {shortPos && (
              <span className="text-xs sm:text-sm font-bold px-2.5 py-1 rounded-md bg-amber-200 border border-black text-black shadow-[1px_1px_0px_#000]">
                {shortPos}
              </span>
            )}
          </div>

          {/* Phiên âm */}
          {card.phonetic && (
            <p className="text-slate-500 font-mono text-lg mb-8 tracking-wide">
              {formatPhonetic(card.phonetic)}
            </p>
          )}

          {/* Gợi ý lật thẻ ở đáy */}
          <div className="absolute bottom-6 inset-x-0 flex items-center justify-center text-xs font-bold uppercase tracking-wider text-slate-400 gap-1.5">
            <span>💡 Nhấp vào thẻ hoặc nhấn [Space] để xem nghĩa</span>
          </div>
        </div>

        {/* ==================== MẶT SAU (CARD BACK) ==================== */}
        <div
          className={`absolute inset-0 flex flex-col justify-between p-6 sm:p-8 text-left bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_#000] overflow-y-auto scrollbar-thin ${
            !showBack ? 'pointer-events-none' : ''
          }`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div>
            {/* Header mặt sau: Từ + Từ loại + Nghĩa chính + Nút Loa */}
            <div className="flex justify-between items-start pb-3 border-b-2 border-black/10">
              <div className="pr-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-500 tracking-wide uppercase">
                    {word}
                  </span>
                  {shortPos && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-200 border border-black text-black">
                      ({shortPos})
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 leading-snug tracking-tight m-0">
                  {vietnameseMeaning}
                </h2>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(e);
                }}
                className="p-2.5 border-2 border-black rounded-full bg-amber-100 hover:bg-amber-200 active:scale-95 shadow-[2px_2px_0px_#000] cursor-pointer shrink-0 transition-transform"
                title="Nghe phát âm"
              >
                <SoundOutlined className="text-lg text-black" />
              </button>
            </div>

            {/* Định nghĩa tiếng Anh bổ sung (chỉ hiện khi thực sự là tiếng Anh và không trùng nghĩa Việt) */}
            {card.definitionEn &&
              card.definitionEn.trim().toLowerCase() !== vietnameseMeaning.trim().toLowerCase() &&
              !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(card.definitionEn) && (
                <p className="text-xs sm:text-sm text-slate-500 italic mt-3 mb-1">
                  Definition: <span className="text-slate-700 font-medium">"{card.definitionEn}"</span>
                </p>
              )}

            {/* Khung câu ví dụ thực tế */}
            {(exampleEn || exampleVi) && (
              <div className="my-4 p-4 bg-amber-50/70 border-2 border-black/15 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,0.03)] space-y-1.5">
                {exampleEn && (
                  <p className="text-sm sm:text-base font-semibold text-slate-800 italic leading-relaxed m-0">
                    "{exampleEn}"
                  </p>
                )}
                {exampleVi && (
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed m-0 flex items-start gap-1">
                    <span>👉</span>
                    <span>{exampleVi}</span>
                  </p>
                )}
              </div>
            )}

            {/* Cụm Từ đồng nghĩa (Synonyms) */}
            {synonyms.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-extrabold text-slate-500 uppercase tracking-wide mr-1">
                  Đồng nghĩa:
                </span>
                {synonyms.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-slate-800 font-semibold shadow-[1px_1px_0px_rgba(0,0,0,0.1)]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Cụm Từ trái nghĩa (Antonyms) */}
            {antonyms.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-extrabold text-rose-500 uppercase tracking-wide mr-1">
                  Trái nghĩa:
                </span>
                {antonyms.map((a, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-semibold shadow-[1px_1px_0px_rgba(0,0,0,0.1)]"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Indicator quay lại */}
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mt-4 pt-2 border-t border-black/5">
            [ Nhấp vào thẻ hoặc nhấn Space để quay lại ]
          </div>
        </div>
      </motion.div>
    </div>
  );
};
