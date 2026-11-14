import { apiClient } from '../../../api/client';
import type { QuizEvent, TimedQuizView, VocabularyMode } from '../components/useTimedVocabularyQuiz';
import type { QuizAttemptDetailResponse } from '../../../types';

export const timedVocabularyService = {
  modes: async (): Promise<Record<string, boolean | number>> => (await apiClient.get('/quiz-attempts/vocabulary/modes')).data.data,
  start: async (type: VocabularyMode): Promise<TimedQuizView> => (await apiClient.post(`/quiz-attempts/vocabulary/start/${type}`)).data.data,
  event: async (id: number, event: QuizEvent): Promise<TimedQuizView> => (await apiClient.post(`/quiz-attempts/vocabulary/${id}/event`, event)).data.data,
  finish: async (id: number, abandoned: boolean, answers: unknown[] = []): Promise<QuizAttemptDetailResponse> =>
    (await apiClient.post(`/quiz-attempts/${id}/submit`, { answers, abandoned })).data.data,
};
