export interface AiMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
  timestamp: Date;
  status?: 'pending' | 'complete' | 'incomplete' | 'error' | 'interrupted';
  requestText?: string;
  clientMessageId?: string;
  finishReason?: string;
  model?: string;
  usageMetadata?: AiChatResponse['usageMetadata'];
}

export interface AiChatRequest {
  message: string;
  conversationId?: string;
  clientMessageId?: string;
  history?: { role: 'user' | 'model'; text: string }[];
}

export interface AiChatResponse {
  content: string;
  finishReason: string;
  complete: boolean;
  model?: string;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
  errorCode?: string;
  requestId: string;
}
