export interface AiMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
  timestamp: Date;
}

export interface AiChatRequest {
  message: string;
  conversationId?: string;
}
