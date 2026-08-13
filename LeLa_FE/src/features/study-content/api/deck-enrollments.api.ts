import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse, DeckEnrollmentResponse, Page } from '../../../shared/types/lela';

export const deckEnrollmentsApi = {
  enroll: async (deckId: number): Promise<ApiResponse<DeckEnrollmentResponse>> => {
    // We send a request to enroll
    const res = await apiClient.post<ApiResponse<DeckEnrollmentResponse>>(`/enrollments/decks/${deckId}/enroll`, { status: 'ACTIVE' });
    return res.data;
  },
  updateStatus: async (deckId: number, status: string): Promise<ApiResponse<DeckEnrollmentResponse>> => {
    const res = await apiClient.patch<ApiResponse<DeckEnrollmentResponse>>(`/enrollments/decks/${deckId}/status`, { status });
    return res.data;
  },
  getMyList: async (params?: { page?: number; size?: number }): Promise<ApiResponse<Page<DeckEnrollmentResponse>>> => {
    const res = await apiClient.get<ApiResponse<Page<DeckEnrollmentResponse>>>('/enrollments/my-list', { params });
    return res.data;
  },
  getTodayReviews: async (params?: { page?: number; size?: number }): Promise<ApiResponse<Page<DeckEnrollmentResponse>>> => {
    const res = await apiClient.get<ApiResponse<Page<DeckEnrollmentResponse>>>('/enrollments/today-reviews', { params });
    return res.data;
  },
};
