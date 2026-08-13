import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse, Page } from '../../../shared/types/lela';
import { normalizeQuizId } from '../utils/quiz-attempts';

export const quizAttemptsApi = {
  getAll: async (params?: any): Promise<ApiResponse<Page<any>>> => {
    const res = await apiClient.get<ApiResponse<Page<any>>>('/quiz-attempts', { params });
    return res.data;
  },
  getMyAttempts: async (params?: any): Promise<ApiResponse<Page<any>>> => {
    const res = await apiClient.get<ApiResponse<Page<any>>>('/quiz-attempts/my', { params });
    return res.data;
  },
  create: async (data: any): Promise<ApiResponse<any>> => {
    const res = await apiClient.post<ApiResponse<any>>('/quiz-attempts', data);
    return res.data;
  },
  startAttempt: async (quizId: number | string | null | undefined): Promise<ApiResponse<any>> => {
    const numericQuizId = normalizeQuizId(quizId);

    if (!numericQuizId) {
      throw new Error(`Invalid quizId when starting attempt: ${quizId}`);
    }

    const res = await apiClient.post<ApiResponse<any>>(`/quiz-attempts/start/${numericQuizId}`, {});
    return res.data;
  },
  submitAttempt: async (attemptId: number, data: any): Promise<ApiResponse<any>> => {
    const res = await apiClient.post<ApiResponse<any>>(`/quiz-attempts/${attemptId}/submit`, data);
    return res.data;
  },
  getAttemptDetail: async (publicId: string): Promise<ApiResponse<any>> => {
    const res = await apiClient.get<ApiResponse<any>>(`/quiz-attempts/${publicId}/detail`);
    return res.data;
  }
};
