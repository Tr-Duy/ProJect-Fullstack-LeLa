import { apiClient } from '../../../api/client';
import { API_BASE_URL } from '../../../constants/config';
import { storage } from '../../../utils/storage';
import { ApiResponse } from '../../../types';

export type SenderType = 'GUEST' | 'LEARNER' | 'ADMIN' | 'AI';
export type ConversationStatus = 'OPEN' | 'CLOSED';

export interface ChatMessage {
  id: number | string;
  conversationId?: number;
  senderType: SenderType;
  senderId?: number;
  content: string;
  isRead?: boolean;
  createdAt: string;
}

export interface ChatConversation {
  id: number;
  guestToken?: string;
  userId?: number;
  username?: string;
  fullName?: string;
  assignedAdminId?: number;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  lastMessage?: ChatMessage;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

const AI_CHAT_STORAGE_KEY = 'lela_mobile_ai_chat_history';

export const chatService = {
  // ==========================================
  // 1. PHÂN HỆ GIA SƯ AI (AI TUTOR CHAT)
  // ==========================================

  /**
   * Gửi câu hỏi đến Gia sư AI (POST /ai/chat - SSE / Text Stream)
   * Tự động bóc tách các dòng "data: <chunk>" và trả về văn bản hoàn chỉnh
   */
  async sendAiMessage(
    message: string,
    onChunk?: (textAccumulated: string) => void
  ): Promise<string> {
    const token = await storage.getAccessToken();

    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream, text/plain, */*',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`AI Tutor server error: ${response.status}`);
      }

      // Xử lý đọc văn bản trả về
      const rawText = await response.text();
      const lines = rawText.split('\n');
      let result = '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const chunk = trimmed.substring(5).trim();
          if (chunk) {
            result += (result.length > 0 ? '\n' : '') + chunk;
            if (onChunk) {
              onChunk(result);
            }
          }
        }
      }

      // Nếu server không trả dạng SSE thì lấy trực tiếp rawText
      if (!result.trim() && rawText.trim()) {
        result = rawText.trim();
      }

      return (
        result ||
        'Gia sư AI đã ghi nhận câu hỏi của bạn. Hãy tiếp tục đặt câu hỏi từ vựng hoặc ngữ pháp nhé!'
      );
    } catch (error: any) {
      console.warn('[chatService] Lỗi kết nối AI Tutor stream:', error);
      throw new Error(
        error?.message || 'Không thể kết nối đến Gia sư AI. Vui lòng thử lại sau.'
      );
    }
  },

  /**
   * Lưu lịch sử chat AI vào bộ nhớ thiết bị
   */
  async saveAiHistory(messages: AiChatMessage[]): Promise<void> {
    try {
      await storage.saveItem(AI_CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch (e) {
      console.warn('[chatService] Lỗi lưu lịch sử chat AI:', e);
    }
  },

  /**
   * Đọc lịch sử chat AI từ bộ nhớ thiết bị
   */
  async getAiHistory(): Promise<AiChatMessage[]> {
    try {
      const saved = await storage.getItem(AI_CHAT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[chatService] Lỗi đọc lịch sử chat AI:', e);
    }
    return [];
  },

  /**
   * Xóa toàn bộ lịch sử trò chuyện cùng AI
   */
  async clearAiHistory(): Promise<void> {
    try {
      await storage.deleteItem(AI_CHAT_STORAGE_KEY);
    } catch {
      // Ignored
    }
  },

  // ==========================================
  // 2. PHÂN HỆ HỖ TRỢ ADMIN (ADMIN SUPPORT CHAT)
  // ==========================================

  /**
   * Khởi tạo hoặc lấy phiên trò chuyện hỗ trợ giữa Học viên và Ban quản trị
   */
  async startOrGetLearnerChat(): Promise<ChatConversation> {
    const response = await apiClient.post<ApiResponse<ChatConversation>>('/chat/learner/start');
    return response.data?.data;
  },

  /**
   * Lấy danh sách tin nhắn trong một cuộc hội thoại hỗ trợ
   */
  async getAdminChatMessages(conversationId: number): Promise<ChatMessage[]> {
    const response = await apiClient.get<ApiResponse<ChatMessage[]>>(
      `/chat/conversations/${conversationId}/messages`
    );
    return response.data?.data || [];
  },

  /**
   * Gửi tin nhắn mới đến Admin
   */
  async sendMessageToAdmin(conversationId: number, content: string): Promise<ChatMessage> {
    const response = await apiClient.post<ApiResponse<ChatMessage>>(
      `/chat/conversations/${conversationId}/messages`,
      {
        conversationId,
        content,
      }
    );
    return response.data?.data;
  },
};

export default chatService;

