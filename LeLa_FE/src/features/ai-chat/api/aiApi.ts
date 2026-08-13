import type { AiChatRequest } from '../types/ai.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const aiApi = {
  async streamChat(
    request: AiChatRequest, 
    onMessage: (text: string) => void, 
    onError: (err: any) => void, 
    onComplete: () => void,
    signal?: AbortSignal
  ) {
    const token = localStorage.getItem('accessToken');
    
    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(request),
        signal
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.substring(5).trim();
              if (data) {
                onMessage(data);
              }
            } else if (line.startsWith('event:error')) {
              onError(new Error('Server sent an error event'));
            }
          }
        }
      }
      onComplete();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        onError(error);
      }
    }
  }
};
