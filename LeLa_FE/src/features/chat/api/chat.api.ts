import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse } from '../../../shared/types/lela';
import type { ChatConversation, ChatMessage, GuestStartChatRequest } from '../types/chat.types';

export const chatApi = {
  startGuestChat: async (data: GuestStartChatRequest): Promise<ApiResponse<ChatConversation>> => {
    const res = await apiClient.post<ApiResponse<ChatConversation>>('/chat/guest/start', data);
    return res.data;
  },
  
  startLearnerChat: async (): Promise<ApiResponse<ChatConversation>> => {
    const res = await apiClient.post<ApiResponse<ChatConversation>>('/chat/learner/start');
    return res.data;
  },

  getMessages: async (conversationId: number): Promise<ApiResponse<ChatMessage[]>> => {
    const res = await apiClient.get<ApiResponse<ChatMessage[]>>(`/chat/conversations/${conversationId}/messages`);
    return res.data;
  },

  getGuestMessages: async (guestToken: string): Promise<ApiResponse<ChatMessage[]>> => {
    const res = await apiClient.get<ApiResponse<ChatMessage[]>>(`/chat/guest/${guestToken}/messages`);
    return res.data;
  },
  
  getGuestConversation: async (guestToken: string): Promise<ApiResponse<ChatConversation>> => {
    const res = await apiClient.get<ApiResponse<ChatConversation>>(`/chat/guest/${guestToken}/conversation`);
    return res.data;
  },

  getOpenConversations: async (): Promise<ApiResponse<ChatConversation[]>> => {
    const res = await apiClient.get<ApiResponse<ChatConversation[]>>('/chat/admin/conversations');
    return res.data;
  },

  closeConversation: async (conversationId: number): Promise<ApiResponse<void>> => {
    const res = await apiClient.put<ApiResponse<void>>(`/chat/admin/conversations/${conversationId}/close`);
    return res.data;
  }
};
