import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse, Page, QuizQuestionResponse } from '../../../shared/types/lela';

export const quizQuestionsApi = {
  getAll: async (params?: any): Promise<ApiResponse<Page<QuizQuestionResponse>>> => {
    const res = await apiClient.get<ApiResponse<Page<QuizQuestionResponse>>>('/quiz-questions', { params });
    return res.data;
  },
  getById: async (id: number): Promise<ApiResponse<QuizQuestionResponse>> => {
    const res = await apiClient.get<ApiResponse<QuizQuestionResponse>>(`/quiz-questions/${id}`);
    return res.data;
  },
  create: async (data: any): Promise<ApiResponse<QuizQuestionResponse>> => {
    const res = await apiClient.post<ApiResponse<QuizQuestionResponse>>('/quiz-questions', data);
    return res.data;
  },
  update: async (id: number, data: any): Promise<ApiResponse<QuizQuestionResponse>> => {
    const res = await apiClient.patch<ApiResponse<QuizQuestionResponse>>(`/quiz-questions/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/quiz-questions/${id}`);
    return res.data;
  }
};
