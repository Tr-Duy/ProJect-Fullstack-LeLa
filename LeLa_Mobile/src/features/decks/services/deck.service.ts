import { apiClient } from '../../../api/client';
import { ApiResponse, DeckResponse, FlashcardResponse, DeckEnrollmentResponse, Page } from '../../../types';

export const deckService = {
  getDecks: async (page = 0, size = 15): Promise<Page<DeckResponse>> => {
    const res = await apiClient.get<Page<DeckResponse>>('/decks', {
      params: { page, size },
    });
    return res.data;
  },

  getDeckById: async (id: number): Promise<DeckResponse> => {
    const res = await apiClient.get<DeckResponse>(`/decks/${id}`);
    return res.data;
  },

  getDeckCards: async (deckId: number, page = 0, size = 50): Promise<Page<FlashcardResponse>> => {
    const res = await apiClient.get<Page<FlashcardResponse>>(`/flashcards/deck/${deckId}`, {
      params: { page, size },
    });
    return res.data;
  },

  enrollDeck: async (deckId: number): Promise<DeckEnrollmentResponse> => {
    const res = await apiClient.post<ApiResponse<DeckEnrollmentResponse>>(
      `/enrollments/decks/${deckId}/enroll`,
      {}
    );
    return res.data.data;
  },

  getMyEnrollments: async (page = 0, size = 20): Promise<Page<DeckEnrollmentResponse>> => {
    const res = await apiClient.get<ApiResponse<Page<DeckEnrollmentResponse>>>('/enrollments/my-list', {
      params: { page, size },
    });
    return res.data.data;
  },
};

