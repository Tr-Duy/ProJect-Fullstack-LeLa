import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dailyActivitiesApi, type DailyActivityDto } from '../api/daily-activities.api';
import { useAuth } from '../../../shared/providers/AuthProvider';
import { formatLocalISODate } from '../../../shared/utils/dateUtils';

export interface WeekDayItem {
  label: string;
  date: string;
  isToday: boolean;
  isFuture: boolean;
  hasLearned: boolean;
}

export function useStreakData() {
  const { user } = useAuth();
  const tz = (user as any)?.timezone || 'Asia/Ho_Chi_Minh';

  // 1. Today activity
  const { data: todayResp, isLoading: isLoadingToday } = useQuery({
    queryKey: ['daily-activity', 'today'],
    queryFn: () => dailyActivitiesApi.getToday(),
    staleTime: 1000 * 60, // 1 min
  });

  // Calculate current week range (Monday to Sunday) in VN timezone
  const { mondayIso, sundayIso, weekIsoDays } = useMemo(() => {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);

    const weekDays: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(formatLocalISODate(d, tz));
    }

    return {
      mondayIso: weekDays[0],
      sundayIso: weekDays[6],
      weekIsoDays: weekDays,
    };
  }, [tz]);

  // 2. Week history from daily_learning_activities
  const { data: historyResp, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['daily-activity', 'history', mondayIso, sundayIso],
    queryFn: () => dailyActivitiesApi.getHistory({ startDate: mondayIso, endDate: sundayIso }),
    staleTime: 1000 * 60 * 5,
  });

  const todayData: DailyActivityDto | undefined = todayResp?.data;
  const historyData: DailyActivityDto[] = historyResp?.data || [];

  // Unified single source of truth for current streak
  const currentStreak = todayData?.currentStreak ?? user?.streakCurrent ?? 0;

  // Lịch 7 ngày (T2..CN)
  const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const todayIso = formatLocalISODate(new Date(), tz);

  const weekDays: WeekDayItem[] = useMemo(() => {
    return weekIsoDays.map((iso, idx) => {
      const isToday = iso === todayIso;
      const isFuture = iso > todayIso;

      // Find record in history
      const record = historyData.find((h) => h.activityDate === iso);
      const hasRecordActivity = Boolean(
        record &&
          (record.active ||
            (record.reviewCount ?? 0) > 0 ||
            (record.xpEarned ?? 0) > 0 ||
            (record.cardsLearned ?? 0) > 0 ||
            (record.quizCount ?? 0) > 0)
      );

      const hasTodayActivity =
        isToday &&
        Boolean(
          todayData &&
            (todayData.active ||
              (todayData.reviewCount ?? 0) > 0 ||
              (todayData.xpEarned ?? 0) > 0 ||
              (todayData.cardsLearned ?? 0) > 0)
        );

      return {
        label: labels[idx],
        date: iso,
        isToday,
        isFuture,
        hasLearned: hasRecordActivity || hasTodayActivity,
      };
    });
  }, [weekIsoDays, todayIso, historyData, todayData]);

  return {
    currentStreak,
    todayData,
    historyData,
    weekDays,
    isLoading: isLoadingToday || isLoadingHistory,
  };
}
