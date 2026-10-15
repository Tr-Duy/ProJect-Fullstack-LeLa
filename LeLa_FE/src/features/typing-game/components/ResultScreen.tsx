import React from 'react';
import type { TypingRunResultResponse } from '../types/typingGame.types';
import {
  Trophy,
  RotateCcw,
  Volume2,
  Share2,
  ListFilter,
  XCircle,
  Award,
  Sparkles,
} from 'lucide-react';
import { Button } from 'antd';
import { soundManager } from '../engine/soundManager';
import { exportResultImage } from '../utils/imageExport';

interface ResultScreenProps {
  result: TypingRunResultResponse;
  onPlayAgain: () => void;
  onBackToDecks: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onPlayAgain,
  onBackToDecks,
}) => {
  const isVictory = result.status === 'COMPLETED';

  const handleSpeak = (word: string, audioUrl?: string) => {
    soundManager.speakWord(word, audioUrl);
  };

  const handleDownloadCard = () => {
    exportResultImage(result);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Result Card */}
      <div className="bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-[var(--shadow-md)] mb-8 text-center relative overflow-hidden">
        {/* New High Score Ribbon */}
        {result.isNewHighScore && (
          <div className="absolute top-4 right-4 bg-amber-400 border border-[var(--border)] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[var(--shadow-md)] animate-bounce">
            <Sparkles className="w-4 h-4 text-black fill-current" />
            <span className="text-xs font-black text-black ">Kỷ lục mới!</span>
          </div>
        )}

        <div className="inline-flex p-4 rounded-full border border-[var(--border)] mb-4 bg-[#F4F3EE] shadow-[var(--shadow-md)]">
          {isVictory ? (
            <Trophy className="w-12 h-12 text-yellow-500 fill-yellow-400" />
          ) : (
            <Award className="w-12 h-12 text-[#2A8B9D]" />
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-[#2B1B0E] tracking-tight  mb-2">
          {isVictory ? 'HOÀN THÀNH XUẤT SẮC!' : 'KẾT THÚC LƯỢT CHƠI'}
        </h1>
        <p className="text-sm font-bold text-gray-500 max-w-md mx-auto mb-6">
          Bộ từ vựng: <strong className="text-black">{result.deckTitle}</strong> | Chế độ:{' '}
          <span className="text-[#2A8B9D] font-black">{result.mode}</span>
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
          <div className="p-4 bg-[#F4F3EE] border border-[var(--border)] rounded-xl">
            <div className="text-[11px] font-black text-gray-500 ">ĐIỂM SỐ</div>
            <div className="text-3xl font-black text-amber-500">{result.score}</div>
          </div>

          <div className="p-4 bg-[#F4F3EE] border border-[var(--border)] rounded-xl">
            <div className="text-[11px] font-black text-gray-500 ">TỐC ĐỘ GÕ</div>
            <div className="text-3xl font-black text-[#2A8B9D]">{result.wpm} <span className="text-sm font-bold text-gray-500">WPM</span></div>
          </div>

          <div className="p-4 bg-[#F4F3EE] border border-[var(--border)] rounded-xl">
            <div className="text-[11px] font-black text-gray-500 ">ĐỘ CHÍNH XÁC</div>
            <div className="text-3xl font-black text-emerald-500">{result.accuracy}%</div>
          </div>

          <div className="p-4 bg-[#F4F3EE] border border-[var(--border)] rounded-xl">
            <div className="text-[11px] font-black text-gray-500 ">MỐC VƯỢT QUA</div>
            <div className="text-3xl font-black text-[var(--brand-700)]">
              {result.stageReached} / {result.totalStages}
            </div>
          </div>

          <div className="p-4 bg-[#F4F3EE] border border-[var(--border)] rounded-xl">
            <div className="text-[11px] font-black text-gray-500 ">MAX COMBO</div>
            <div className="text-3xl font-black text-orange-500">{result.maxCombo}x</div>
          </div>

          <div className="p-4 bg-[#F4F3EE] border border-[var(--border)] rounded-xl">
            <div className="text-[11px] font-black text-gray-500 ">XP NHẬN ĐƯỢC</div>
            <div className="text-3xl font-black text-rose-500">+{result.xpEarned}</div>
            <div className="text-[10px] font-bold text-gray-400 mt-0.5">
              (Còn {result.dailyXpRemaining}/150 XP hôm nay)
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="primary"
            onClick={onPlayAgain}
            className="font-black bg-[#2A8B9D] hover:!bg-[#237585] border border-[var(--border)] shadow-[var(--shadow-md)] active:translate-y-0.5 flex items-center gap-1.5 h-11 px-6 text-sm"
          >
            <RotateCcw className="w-4 h-4" /> Chơi Lại
          </Button>

          <Button
            onClick={handleDownloadCard}
            className="font-black border border-[var(--border)] shadow-[var(--shadow-md)] active:translate-y-0.5 flex items-center gap-1.5 h-11 px-6 text-sm"
          >
            <Share2 className="w-4 h-4" /> Tải Ảnh Kỷ Lục
          </Button>

          <Button
            type="default"
            onClick={onBackToDecks}
            className="font-black border border-[var(--border)] shadow-[var(--shadow-md)] active:translate-y-0.5 h-11 px-6 text-sm"
          >
            Đổi Bộ Thẻ
          </Button>
        </div>
      </div>

      {/* Review Section */}
      {result.reviewWords && result.reviewWords.length > 0 && (
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-[var(--shadow-md)]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-[var(--border)]">
            <ListFilter className="w-5 h-5 text-[#F05A4A]" />
            <h2 className="text-xl font-black text-[#2B1B0E] ">
              Từ Vựng Cần Ôn Lại ({result.reviewWords.length})
            </h2>
          </div>
          <p className="text-xs font-semibold text-gray-500 mb-6">
            Hệ thống đã tự động kéo lịch ôn tập SM-2 sớm hơn cho các từ bạn bị rơi hoặc gõ sai nhiều phím.
          </p>

          <div className="divide-y-2 border-y-2 border-[var(--border)]">
            {result.reviewWords.map((word) => (
              <div key={word.flashcardId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-[#2B1B0E]">{word.word}</span>
                    {word.phonetic && (
                      <span className="text-xs font-semibold text-gray-500">[{word.phonetic}]</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSpeak(word.word, word.audioUrl)}
                      className="p-1 text-cyan-600 hover:text-cyan-800 transition-colors"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    {word.result === 'MISSED' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-300">
                        <XCircle className="w-3.5 h-3.5" /> Bị rơi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                        Sai {word.wrongKeystrokes} phím
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-gray-700 mt-1">{word.meaning}</p>

                  {word.exampleText && (
                    <div className="mt-1 text-xs text-gray-500 italic">
                      &quot;{word.exampleText}&quot;
                      {word.exampleMeaning && ` - ${word.exampleMeaning}`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
