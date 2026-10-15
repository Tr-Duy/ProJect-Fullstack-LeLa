import React, { useState } from 'react';
import type { TypingGameDeckDto, TypingGameMode } from '../types/typingGame.types';
import { Lock, Play, Trophy, Sparkles, BookOpen, Layers, Flame } from 'lucide-react';
import { Button, Tooltip, Switch } from 'antd';

interface DeckPickerProps {
  decks: TypingGameDeckDto[];
  isLoading: boolean;
  onSelectDeck: (deckId: number, mode: TypingGameMode, expandedChallenge?: boolean) => void;
  onViewLeaderboard: (deckId: number, mode: TypingGameMode) => void;
}

export const DeckPicker: React.FC<DeckPickerProps> = ({
  decks,
  isLoading,
  onSelectDeck,
  onViewLeaderboard,
}) => {
  const [selectedModes, setSelectedModes] = useState<Record<number, TypingGameMode>>({});
  const [expandedChallenge, setExpandedChallenge] = useState<boolean>(false);

  const getMode = (deckId: number): TypingGameMode => {
    return selectedModes[deckId] || 'EASY';
  };

  const handleModeChange = (deckId: number, mode: TypingGameMode) => {
    setSelectedModes((prev) => ({ ...prev, [deckId]: mode }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#2A8B9D] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-gray-600">Đang tải danh sách bộ từ vựng...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-black text-[#2B1B0E] tracking-tight">
          LUYỆN GÕ TỪ VỰNG <span className="text-[#F05A4A]">.</span>
        </h1>
        <p className="mt-3 text-lg font-medium text-gray-600 max-w-2xl mx-auto">
          Bắn phá từ rơi kiểu Parroto Word Rain. Thử thách phản xạ gõ phím, củng cố trí nhớ và leo bảng xếp hạng!
        </p>
      </div>

      {/* Banner cấu hình: Chế độ Thử Thách Mở Rộng (100+ từ) */}
      <div className="mb-8 p-4 bg-white border-2 border-[var(--border)] rounded-2xl max-w-2xl mx-auto shadow-[var(--shadow-md)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 border border-amber-300 rounded-xl text-amber-700">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-[#2B1B0E]">Chế độ Thử Thách Mở Rộng (100+ từ)</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                HOT
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Tự động gộp thẻ từ các bộ từ vựng cùng chủ đề để tạo ván đấu dài 100+ từ kịch tính (5 mốc x 20 từ)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs font-bold text-gray-600">{expandedChallenge ? 'Đã bật' : 'Tắt'}</span>
          <Switch
            checked={expandedChallenge}
            onChange={setExpandedChallenge}
            className={expandedChallenge ? 'bg-[#2A8B9D]' : 'bg-slate-300'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map((deck) => {
          const currentMode = getMode(deck.deckId);
          const bestScore = currentMode === 'EASY' ? deck.bestScoreEasy : deck.bestScoreHard;

          return (
            <div
              key={deck.deckId}
              className={`relative bg-white border border-[var(--border)] rounded-xl p-6 shadow-[var(--shadow-md)] flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] ${
                deck.isLocked ? 'opacity-85 bg-gray-50' : ''
              }`}
            >
              {/* Badge PRO / FREE */}
              <div className="flex items-center justify-between mb-4">
                {deck.requiresPro ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#FBBF24] border border-[var(--border)] text-xs font-black rounded-full ">
                    <Sparkles className="w-3.5 h-3.5" /> PRO ONLY
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 bg-[#4ADE80] border border-[var(--border)] text-xs font-black rounded-full ">
                    FREE
                  </span>
                )}

                {deck.isLocked && (
                  <Tooltip title="Bộ từ này yêu cầu tài khoản PLUS hoặc PREMIUM">
                    <span className="inline-flex items-center gap-1 text-red-500 font-bold text-xs">
                      <Lock className="w-4 h-4" /> Đã khóa
                    </span>
                  </Tooltip>
                )}
              </div>

              {/* Title & Description */}
              <div className="mb-5">
                <h3 className="text-xl font-black text-[#2B1B0E] line-clamp-1 mb-2">
                  {deck.title}
                </h3>
                <p className="text-xs font-medium text-gray-500 line-clamp-2 min-h-[32px]">
                  {deck.description || 'Luyện tập các từ vựng thông dụng và nâng cao.'}
                </p>
              </div>

              {/* Deck Stats */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#F4F3EE] border border-[var(--border)] rounded-lg mb-5 text-xs font-bold">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <BookOpen className="w-3.5 h-3.5 text-[#2A8B9D]" />
                  <span>{deck.totalCards} từ vựng</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700">
                  <Layers className="w-3.5 h-3.5 text-[#F05A4A]" />
                  <span>{deck.totalStages} mốc chơi</span>
                </div>
              </div>

              {/* High Score & Mode Switcher */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-gray-500 ">Chế độ chơi:</span>
                  <div className="flex gap-1 bg-gray-100 p-0.5 border border-[var(--border)] rounded-md">
                    <button
                      type="button"
                      onClick={() => handleModeChange(deck.deckId, 'EASY')}
                      className={`px-2.5 py-1 text-xs font-black rounded transition-colors ${
                        currentMode === 'EASY'
                          ? 'bg-[#2A8B9D] text-white shadow-sm'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      DỄ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeChange(deck.deckId, 'HARD')}
                      className={`px-2.5 py-1 text-xs font-black rounded transition-colors ${
                        currentMode === 'HARD'
                          ? 'bg-[#F05A4A] text-white shadow-sm'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      KHÓ
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Kỷ lục cá nhân:
                  </span>
                  <span className="font-black text-[#2B1B0E]">{bestScore > 0 ? `${bestScore} điểm` : 'Chưa có'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  type="default"
                  onClick={() => onViewLeaderboard(deck.deckId, currentMode)}
                  className="flex-1 font-bold border border-[var(--border)] hover:border-[var(--border)] shadow-[var(--shadow-md)] active:translate-y-0.5"
                >
                  Bảng Điểm
                </Button>

                <Button
                  type="primary"
                  disabled={deck.isLocked}
                  onClick={() => onSelectDeck(deck.deckId, currentMode, expandedChallenge)}
                  className={`flex-1 font-black border border-[var(--border)] shadow-[var(--shadow-md)] active:translate-y-0.5 flex items-center justify-center gap-1.5 ${
                    deck.isLocked ? 'bg-gray-300 text-gray-500' : 'bg-[#2A8B9D] hover:!bg-[#237585]'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" /> Bắt đầu
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
