import { apiClient } from '../../../shared/lib/api';
import type { QuizEvent, TimedQuizView, VocabularyMode } from '../components/useTimedVocabularyQuiz';
export const timedVocabularyApi = {
  modes: async (): Promise<Record<string, boolean | number>> => (await apiClient.get('/quiz-attempts/vocabulary/modes')).data.data,
  start: async (type: VocabularyMode): Promise<TimedQuizView> => (await apiClient.post(`/quiz-attempts/vocabulary/start/${type}`)).data.data,
  event: async (id: number, event: QuizEvent): Promise<TimedQuizView> => (await apiClient.post(`/quiz-attempts/vocabulary/${id}/event`, event)).data.data,
};
