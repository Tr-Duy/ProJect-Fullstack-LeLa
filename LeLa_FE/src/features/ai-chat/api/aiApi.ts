import { apiClient } from '../../../shared/lib/api';
import type { AiChatRequest, AiChatResponse } from '../types/ai.types';
import { TutorSseParser } from './tutorSse';

export const aiApi = {
  async stream(request: AiChatRequest, onText: (text: string) => void, signal: AbortSignal): Promise<AiChatResponse> {
    // Fetch adapter streams bytes while retaining the SAME Axios authentication/refresh interceptors.
    const response = await apiClient.post<ReadableStream<Uint8Array>>('/ai/chat/stream', request,
      { adapter: 'fetch', responseType: 'stream', signal, timeout: 120_000, headers: { Accept: 'text/event-stream' } });
    const reader = response.data.getReader();
    let result: AiChatResponse | undefined; let text = ''; let sequence = 0;
    const parser = new TutorSseParser((event, data) => {
      if (result) throw new Error('AI_PROTOCOL_AFTER_DONE');
      if (event === 'ready') return;
      if (event === 'error') throw new Error('AI_STREAM_ERROR');
      const payload = JSON.parse(data);
      if (event === 'delta') {
        if (payload.sequence !== sequence++ || typeof payload.text !== 'string') throw new Error('AI_PROTOCOL_SEQUENCE');
        text += payload.text; onText(text);
      } else if (event === 'done') {
        if (typeof payload.content !== 'string' || typeof payload.complete !== 'boolean' ||
            (sequence > 0 && payload.content !== text)) throw new Error('AI_PROTOCOL_CONTENT');
        result = payload;
      } else throw new Error('AI_PROTOCOL_EVENT');
    });
    try {
      while (true) { const { value, done } = await reader.read(); if (done) break; parser.push(value); }
      parser.finish();
      if (!result) throw new Error('AI_PROTOCOL_MISSING_DONE');
      return result;
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  },
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
