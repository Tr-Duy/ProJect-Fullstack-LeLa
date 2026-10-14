import React from 'react';
import { FireFilled } from '@ant-design/icons';
import type { DailyActivityDto } from '../../gamification/api/daily-activities.api';

interface StreakCalendarSectionProps {
  currentStreak: number;
  historyData?: DailyActivityDto[];
}

export const StreakCalendarSection: React.FC<StreakCalendarSectionProps> = ({
  currentStreak,
  historyData = [],
}) => {
  // Build last 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const isoDate = d.toISOString().split('T')[0];
    const isToday = i === 13;
    const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
    const dayOfMonth = d.getDate();

    // Check if user had activity on this date
    const matched = historyData.find((act) => act.activityDate === isoDate);
    const hasActivity = matched?.active || (matched?.xpEarned ?? 0) > 0 || (matched?.reviewCount ?? 0) > 0;

    return {
      date: isoDate,
      dayOfWeek,
      dayOfMonth,
      isToday,
      hasActivity,
      xp: matched?.xpEarned || 0,
      reviews: matched?.reviewCount || 0,
    };
  });

  return (
    <div className="bg-card rounded-[12px] p-5 sm:p-6 border-2 border-ink shadow-[4px_4px_0_var(--ink)] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-ink-mute">
            LỊCH SỬ CHUỖI ÔN TẬP
          </span>
          <h3 className="text-lg font-bold font-display text-ink">
            14 ngày gần nhất
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-paper-2 border border-ink text-xs font-mono font-bold text-ink">
          <FireFilled className="text-coral" />
          <span>{currentStreak} ngày liên tiếp</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 my-2">
        {days.slice(7).map((day) => (
          <div
            key={day.date}
            className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-[8px] border-2 transition-all ${
              day.isToday
                ? 'border-brand bg-sun/20 shadow-[2px_2px_0_var(--brand)] font-bold'
                : day.hasActivity
                ? 'border-ink bg-ink text-paper shadow-[2px_2px_0_var(--ink)]'
                : 'border-line bg-paper/30 text-ink-mute'
            }`}
          >
            <span
              className={`text-[10px] font-mono uppercase ${
                day.hasActivity && !day.isToday ? 'text-paper/70' : 'text-ink-mute'
              }`}
            >
              {day.dayOfWeek}
            </span>
            <span
              className={`text-sm font-mono font-bold my-0.5 tabular-nums ${
                day.hasActivity && !day.isToday ? 'text-paper' : 'text-ink'
              }`}
            >
              {day.dayOfMonth}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                day.hasActivity
                  ? 'bg-mint'
                  : day.isToday
                  ? 'bg-brand'
                  : 'bg-transparent'
              }`}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-ink-soft pt-3 border-t border-line font-sans">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-ink inline-block" /> Đã hoàn thành
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sun border border-brand inline-block" /> Hôm nay
        </span>
        <span className="text-ink-mute font-mono">Giữ nhịp mỗi ngày</span>
      </div>
    </div>
  );
};
