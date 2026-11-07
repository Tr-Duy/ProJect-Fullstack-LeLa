import { apiClient, ApiResponse } from '../../../api/client';
import {
  FlashcardResponse,
  SrsReviewResponse,
  Page,
  DeckResponse,
  ReviewStatsResponse,
} from '../../../types';

export const studyService = {
  /**
   * Lấy thống kê tổng quan về tiến độ học và ôn tập thẻ từ vựng
   */
  getReviewStatistics: async (userId?: number): Promise<ReviewStatsResponse> => {
    const response = await apiClient.get<ApiResponse<ReviewStatsResponse>>(
      '/srs-reviews/statistics',
      {
        params: userId ? { userId } : undefined,
      }
    );
    return response.data?.data;
  },

  /**
   * Lấy danh sách thẻ từ vựng cần học hoặc ôn tập theo thuật toán SRS/SM-2
   * @param deckId Mã ID bộ thẻ (nếu không truyền, tự động tìm bộ thẻ đầu tiên có sẵn)
   * @param mode Chế độ học ('srs', 'cram', 'new')
   */
  getStudyCards: async (deckId?: number, mode = 'srs'): Promise<FlashcardResponse[]> => {
    let targetDeckId = deckId;

    // Nếu không truyền deckId, tự động truy vấn lấy bộ thẻ đầu tiên trong hệ thống
    if (!targetDeckId) {
      const decksResponse = await apiClient.get<Page<DeckResponse>>('/decks', {
        params: { page: 0, size: 1 },
      });
      const firstDeck = decksResponse.data?.content?.[0];
      if (!firstDeck) {
        return [];
      }
      targetDeckId = firstDeck.id;
    }

    const response = await apiClient.get<ApiResponse<FlashcardResponse[]>>(
      `/study/decks/${targetDeckId}/cards`,
      {
        params: { mode },
      }
    );

    return response.data?.data || [];
  },

  /**
   * Gửi đánh giá phản xạ ghi nhớ của người học lên Backend để tính toán thuật toán SM-2
   * @param cardId ID thẻ từ vựng
   * @param rating Đánh giá 1: Again (Lại), 2: Hard (Khó), 3: Good (Tốt), 4: Easy (Dễ)
   * @param responseTimeMs Thời gian phản xạ lật thẻ tính bằng mili-giây
   */
  submitReview: async (
    cardId: number,
    rating: number,
    responseTimeMs: number
  ): Promise<SrsReviewResponse> => {
    const payload = {
      cardId,
      rating,
      responseMs: Math.round(responseTimeMs),
      clientReviewedAt: new Date().toISOString(),
    };

    const response = await apiClient.post<ApiResponse<SrsReviewResponse>>(
      '/srs-reviews',
      payload
    );

    return response.data.data;
  },
};

