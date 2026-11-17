import { apiClient } from '../../../api/client';
import { ApiResponse } from '../../../types';
import type { TimedQuizView } from '../../quiz/components/useTimedVocabularyQuiz';

export interface DeckTestStatusResponse {
  deckId: number;
  deckCode: string;
  deckTitle: string;
  deckLevelName?: string;
  enrolled: boolean;
  hasEnoughCards: boolean;
  totalValidCards: number;
  learnedCards: number;
  requiredLearnedCards: number;
  minValidCardsRequired: number;
  eligible: boolean;
  lockReason?: string;
  hasPassed: boolean;
  bestScore?: number;
  lastAttemptAt?: string;
}

export const deckTestService = {
  getStatus: async (deckId: number): Promise<DeckTestStatusResponse> => {
    const res = await apiClient.get<ApiResponse<DeckTestStatusResponse>>(`/deck-tests/${deckId}/status`);
    return res.data.data;
  },

  getMyOverview: async (): Promise<DeckTestStatusResponse[]> => {
    const res = await apiClient.get<ApiResponse<DeckTestStatusResponse[]>>('/deck-tests/my-overview');
    return res.data.data;
  },

  start: async (deckId: number): Promise<TimedQuizView> => {
    const res = await apiClient.post<ApiResponse<TimedQuizView>>(`/deck-tests/${deckId}/start`);
    return res.data.data;
  },

  event: async (attemptId: number, eventData: any): Promise<TimedQuizView> => {
    const res = await apiClient.post<ApiResponse<TimedQuizView>>(`/deck-tests/${attemptId}/event`, eventData);
    return res.data.data;
  },

  submit: async (attemptId: number, data?: any): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>(`/deck-tests/${attemptId}/submit`, data || {});
    return res.data.data;
  },
};
