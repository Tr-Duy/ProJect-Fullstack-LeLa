import React from 'react';
import { Pause, Play, Volume2, VolumeX, Heart, Zap } from 'lucide-react';
import { Button } from 'antd';

interface GameHudProps {
  score: number;
  combo: number;
  lives: number;
  currentStage: number;
  totalStages: number;
  wordsResolved?: number;
  targetWords?: number;
  isPaused: boolean;
  isMuted: boolean;
  deckTitle: string;
  mode: string;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onQuit: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  score,
  combo,
  lives,
  currentStage,
  totalStages,
  wordsResolved,
  targetWords,
  isPaused,
  isMuted,
  deckTitle,
  mode,
  onTogglePause,
  onToggleMute,
  onQuit,
}) => {
  // Render Hearts (3 to 5 hearts max)
  const hearts = [];
  for (let i = 0; i < 5; i++) {
    const isFilled = i < lives;
    hearts.push(
      <Heart
        key={i}
        className={`w-6 h-6 transition-all duration-300 ${
          isFilled
            ? 'fill-rose-500 text-rose-500 scale-100 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]'
            : 'text-gray-600 scale-90 opacity-40'
        }`}
      />
    );
  }

  const remaining = targetWords !== undefined && targetWords > 0 ? Math.max(0, targetWords - (wordsResolved || 0)) : 0;
  const progressRatio = targetWords !== undefined && targetWords > 0 ? Math.min(100, Math.round(((wordsResolved || 0) / targetWords) * 100)) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-[var(--border)] rounded-xl pt-3 pb-3 px-4 shadow-[var(--shadow-md)] text-white grid grid-cols-1 md:grid-cols-3 items-center justify-between gap-3 mb-3 select-none relative z-10">
      {/* Cột trái: Mốc, Tiến trình & Điểm số */}
      <div className="flex items-center gap-3 justify-start">
        <div className="flex flex-col min-w-[130px]">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm md:text-base text-white tracking-wide truncate max-w-[150px]">
              {deckTitle}
            </span>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-black rounded border border-[var(--border)]  ${
                mode === 'EASY' ? 'bg-[#2A8B9D]' : 'bg-[#F05A4A]'
              }`}
            >
              {mode}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-black text-cyan-400 mt-0.5 tracking-normal">
            <span>MỐC {currentStage} / {totalStages}</span>
            {targetWords !== undefined && targetWords > 0 && (
              <span className="text-[11px] text-gray-300 font-bold ml-1.5">
                {wordsResolved || 0}/{targetWords}
              </span>
            )}
          </div>

          {targetWords !== undefined && targetWords > 0 && (
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-[0_0_6px_rgba(56,189,248,0.6)]"
                style={{ width: `${progressRatio}%` }}
              />
            </div>
          )}

          {targetWords !== undefined && targetWords > 0 && (
            <span className="text-[10px] text-emerald-400 font-medium mt-0.5">
              {remaining === 0 ? 'Đã đủ từ qua mốc!' : `Còn ${remaining} từ`}
            </span>
          )}
        </div>

        <div className="h-9 w-[2px] bg-slate-700 hidden sm:block" />

        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 leading-none">ĐIỂM</span>
          <span className="text-xl md:text-2xl font-black text-emerald-400 tracking-normal leading-tight">
            {score.toLocaleString()} <span className="text-xs font-bold text-emerald-500">PTS</span>
          </span>
        </div>
      </div>

      {/* Cột giữa: Cụm nút điều khiển (Loa, Pause, Thoát) */}
      <div className="flex items-center justify-center gap-2.5">
        <Button
          shape="circle"
          onClick={onToggleMute}
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className="border-2 border-[var(--border)] bg-slate-800 text-white hover:!bg-slate-700 flex items-center justify-center h-9 w-9"
          icon={isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        />

        <Button
          shape="circle"
          onClick={onTogglePause}
          title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          className="border-2 border-[var(--border)] bg-slate-800 text-white hover:!bg-slate-700 flex items-center justify-center h-9 w-9"
          icon={isPaused ? <Play className="w-4 h-4 fill-amber-400 text-amber-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
        />

        <button
          type="button"
          onClick={onQuit}
          className="px-4 py-1.5 font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 border-2 border-[var(--border)] rounded-lg shadow-[var(--shadow-md)] active:translate-y-0.5 transition-all flex items-center gap-1.5 ml-1"
        >
          <span>Thoát</span>
        </button>
      </div>

      {/* Cột phải: Hàng tim & Huy hiệu Combo */}
      <div className="flex items-center justify-end gap-3.5">
        {/* Combo Badge */}
        <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
          <span className="font-black text-base text-amber-400">{combo}x</span>
          <span className="text-[10px] font-bold text-gray-400 ">COMBO</span>
        </div>

        {/* Hearts */}
        <div className="flex items-center gap-1 py-1 px-1 bg-slate-800/60 rounded-lg border border-slate-700/50">
          {hearts}
        </div>
      </div>
    </div>
  );
};
