import { apiClient } from '../../../shared/lib/api';
import type { AiChatRequest, AiChatResponse } from '../types/ai.types';

export const aiApi = {
  async chat(request: AiChatRequest, signal?: AbortSignal): Promise<AiChatResponse> {
    // Same Axios client/interceptor as profile and quizzes: refresh a 401 once.
    const response = await apiClient.post('/ai/chat', request, { signal, timeout: 240_000 });
    const result = response.data?.data;
    if (!result || typeof result.content !== 'string' || typeof result.complete !== 'boolean') {
      throw new Error('AI_PROTOCOL');
    }
    return result;
  },
};
