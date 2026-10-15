import React, { useEffect } from 'react';
import { ProgressRing } from '../../../shared/components/ui/ProgressRing';
import { FireFilled, ThunderboltFilled } from '@ant-design/icons';
import type { DailyActivityDto } from '../../gamification/api/daily-activities.api';
import type { WeekDayItem } from '../../gamification/hooks/useStreakData';
import { formatLocalISODate } from '../../../shared/utils/dateUtils';
import { CountUp } from '../../../ui/motion/CountUp';
import { celebrate } from '../../../ui/motion/celebrate';

interface DailyGoalSidebarCardProps {
  cardsReviewedToday: number;
  dailyGoalTarget?: number;
  xpToday: number;
  currentStreak: number;
  historyData?: DailyActivityDto[];
  weekDays?: WeekDayItem[];
}

export const DailyGoalSidebarCard: React.FC<DailyGoalSidebarCardProps> = ({
  cardsReviewedToday,
  dailyGoalTarget = 20,
  xpToday,
  currentStreak,
  historyData = [],
  weekDays: propWeekDays,
}) => {
  const percent = Math.min(
    100,
    Math.round((cardsReviewedToday / Math.max(1, dailyGoalTarget)) * 100)
  );

  // Trigger celebration once when goal is completed
  useEffect(() => {
    if (percent >= 100 && cardsReviewedToday > 0) {
      celebrate({ eventKey: `daily-goal-100-${cardsReviewedToday}` });
    }
  }, [percent, cardsReviewedToday]);

  // 7 days of current week (T2 to CN) - from unified useStreakData hook or calculated
  const currentWeekDays = React.useMemo(() => {
    if (propWeekDays && propWeekDays.length === 7) {
      return propWeekDays;
    }
    const now = new Date();
    // Monday as day 0 in Vietnam
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 is Monday, 6 is Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);

    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const todayIso = formatLocalISODate(now);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = formatLocalISODate(d);
      const isToday = iso === todayIso;
      const isFuture = iso > todayIso;

      const matched = historyData.find((h) => h.activityDate === iso);
      const hasLearned =
        !isFuture &&
        Boolean(
          (matched &&
            (matched.active ||
              (matched.reviewCount ?? 0) > 0 ||
              (matched.xpEarned ?? 0) > 0 ||
              (matched.cardsLearned ?? 0) > 0 ||
              (matched.quizCount ?? 0) > 0)) ||
            (isToday && (cardsReviewedToday > 0 || xpToday > 0))
        );

      return {
        label: labels[i],
        date: iso,
        isToday,
        hasLearned,
      };
    });
  }, [historyData, cardsReviewedToday, xpToday, propWeekDays]);

  return (
    <div className="bg-[var(--surface)] rounded-[20px] p-6 border border-[var(--border)] shadow-[var(--shadow-sm)] flex flex-col justify-between space-y-5">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-[var(--text-3)]">
            Mục tiêu hôm nay
          </span>
          <span className="text-xs font-semibold text-[var(--brand-700)]">
            <strong className="text-[var(--brand)]">{cardsReviewedToday}</strong>/{dailyGoalTarget} thẻ
          </span>
        </div>

        {/* 140px Animated Progress Ring */}
        <div className="flex items-center justify-center py-2">
          <ProgressRing
            percent={percent}
            size={140}
            strokeWidth={12}
            color="var(--brand)"
            trackColor="var(--brand-100)"
          >
            <div className="flex flex-col items-center justify-center">
              <span className="font-display font-bold text-2xl text-[var(--text)] tracking-tight tabular-nums leading-none">
                {cardsReviewedToday}/{dailyGoalTarget}
              </span>
              <span className="text-[11px] font-medium text-[var(--text-3)] mt-1">
                từ vựng
              </span>
            </div>
          </ProgressRing>
        </div>

        {/* 7 Weekday Dots (T2 - CN) */}
        <div className="pt-4 mt-2 border-t border-[var(--border)]">
          <div className="flex items-center justify-between px-1">
            {currentWeekDays.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-1.5">
                <span
                  className={`text-[11px] font-medium ${
                    day.isToday ? 'text-[var(--brand-700)] font-bold' : 'text-[var(--text-3)]'
                  }`}
                >
                  {day.label}
                </span>

                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    day.hasLearned
                      ? 'bg-[var(--flame)]/15 text-[var(--flame)]'
                      : day.isToday
                      ? 'bg-[var(--surface-2)] border-2 border-dashed border-[var(--brand)] text-[var(--brand)]'
                      : 'bg-[var(--surface-2)] text-[var(--border)]'
                  }`}
                >
                  {day.hasLearned ? (
                    <span className="flame-animated">
                      <FireFilled className="text-sm" />
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Numbers Side-by-Side on One Line (No wrap with CountUp!) */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--border)]">
        <div className="p-3 rounded-[14px] bg-[var(--surface-2)] flex flex-col justify-center whitespace-nowrap overflow-hidden">
          <span className="text-[11px] font-medium text-[var(--text-3)] flex items-center gap-1 truncate">
            <ThunderboltFilled className="text-[var(--sun)] text-xs" />
            XP hôm nay
          </span>
          <span className="font-display font-bold text-lg text-[var(--text)] mt-0.5 tabular-nums truncate">
            <CountUp value={xpToday} formatter={(v) => `+${v} XP`} />
          </span>
        </div>

        <div className="p-3 rounded-[14px] bg-[var(--surface-2)] flex flex-col justify-center whitespace-nowrap overflow-hidden">
          <span className="text-[11px] font-medium text-[var(--text-3)] flex items-center gap-1 truncate">
            <span className="flame-animated">
              <FireFilled className="text-[var(--flame)] text-xs" />
            </span>
            Chuỗi ngày
          </span>
          <span className="font-display font-bold text-lg text-[var(--text)] mt-0.5 tabular-nums truncate">
            <CountUp value={currentStreak} formatter={(v) => `${v} ngày`} />
          </span>
        </div>
      </div>
    </div>
  );
};
