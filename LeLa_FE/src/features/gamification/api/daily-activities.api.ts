import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse } from '../../../shared/types/lela';

export interface DailyActivityDto {
  id?: number;
  userId: number;
  activityDate: string;
  timezone?: string;
  active: boolean;
  currentStreak?: number | null;
  reviewCount: number;
  cardsLearned: number;
  quizCount: number;
  minutesSpent: number;
  xpEarned: number;
  goalMet: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const dailyActivitiesApi = {
  getToday: async (): Promise<ApiResponse<DailyActivityDto>> => {
    const res = await apiClient.get<ApiResponse<DailyActivityDto>>('/daily-activities/today');
    return res.data;
  },
  logActivity: async (): Promise<ApiResponse<DailyActivityDto>> => {
    const res = await apiClient.post<ApiResponse<DailyActivityDto>>('/daily-activities/log');
    return res.data;
  },
  getHistory: async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<DailyActivityDto[]>> => {
    const res = await apiClient.get<ApiResponse<DailyActivityDto[]>>('/daily-activities/history', { params });
    return res.data;
  },
};
