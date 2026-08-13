import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse, Page, QuizResponse } from '../../../shared/types/lela';

export const quizzesApi = {
  getAll: async (params?: any): Promise<ApiResponse<Page<QuizResponse>>> => {
    const res = await apiClient.get<ApiResponse<Page<QuizResponse>>>('/quizzes', { params });
    return res.data;
  },
  getById: async (id: number): Promise<ApiResponse<QuizResponse>> => {
    const res = await apiClient.get<ApiResponse<QuizResponse>>(`/quizzes/${id}`);
    return res.data;
  },
  create: async (data: any): Promise<ApiResponse<QuizResponse>> => {
    const res = await apiClient.post<ApiResponse<QuizResponse>>('/quizzes', data);
    return res.data;
  },
  update: async (id: number, data: any): Promise<ApiResponse<QuizResponse>> => {
    const res = await apiClient.patch<ApiResponse<QuizResponse>>(`/quizzes/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/quizzes/${id}`);
    return res.data;
  },
  getByDeckId: async (deckId: number): Promise<ApiResponse<QuizResponse[]>> => {
    const res = await apiClient.get<ApiResponse<QuizResponse[]>>(`/quizzes/deck/${deckId}`);
    return res.data;
  },
  search: async (category: string, examTypeId?: number, levelId?: number): Promise<ApiResponse<QuizResponse[]>> => {
    const res = await apiClient.get<ApiResponse<QuizResponse[]>>(`/quizzes/search`, {
      params: { category, examTypeId, levelId }
    });
    return res.data;
  }
};
