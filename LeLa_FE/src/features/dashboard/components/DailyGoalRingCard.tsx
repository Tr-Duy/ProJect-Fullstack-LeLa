import React from 'react';
import { ProgressRing } from '../../../shared/components/ui/ProgressRing';
import { StatTile } from '../../../shared/components/ui/StatTile';
import { FireFilled, ThunderboltFilled } from '@ant-design/icons';

interface DailyGoalRingCardProps {
  cardsReviewedToday: number;
  dailyGoalTarget?: number;
  xpToday: number;
  currentStreak: number;
}

export const DailyGoalRingCard: React.FC<DailyGoalRingCardProps> = ({
  cardsReviewedToday,
  dailyGoalTarget = 20,
  xpToday,
  currentStreak,
}) => {
  const percent = Math.min(
    100,
    Math.round((cardsReviewedToday / Math.max(1, dailyGoalTarget)) * 100)
  );

  return (
    <div className="bg-card rounded-[12px] p-5 sm:p-6 border-2 border-ink shadow-[4px_4px_0_var(--ink)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-ink-mute">
            MỤC TIÊU HÔM NAY
          </span>
          <span className="text-xs font-mono font-bold text-ink">
            {cardsReviewedToday} / {dailyGoalTarget} THẺ
          </span>
        </div>

        <div className="flex items-center justify-center py-2">
          <ProgressRing
            percent={percent}
            size={116}
            strokeWidth={10}
            color="var(--brand)"
            trackColor="var(--paper-2)"
          />
        </div>

        <p className="text-xs text-center text-ink-soft font-sans mt-3">
          {percent >= 100
            ? '🎉 Đã đạt mục tiêu hôm nay! Bạn có thể học thêm nếu muốn.'
            : `Còn ${Math.max(0, dailyGoalTarget - cardsReviewedToday)} thẻ nữa để hoàn thành chỉ tiêu ngày.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-4 mt-3 border-t border-line">
        <StatTile
          label="XP HÔM NAY"
          value={`+${xpToday}`}
          icon={<ThunderboltFilled className="text-sun" />}
          className="p-2.5 bg-paper/50"
        />
        <StatTile
          label="CHUỖI NGÀY"
          value={`${currentStreak} ngày`}
          icon={<FireFilled className="text-coral" />}
          className="p-2.5 bg-paper/50"
        />
      </div>
    </div>
  );
};
