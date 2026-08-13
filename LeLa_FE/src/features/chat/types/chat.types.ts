export type SenderType = 'GUEST' | 'LEARNER' | 'ADMIN';
export type ConversationStatus = 'OPEN' | 'CLOSED';

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderType: SenderType;
  senderId?: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatConversation {
  id: number;
  guestToken?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestDepartment?: string;
  userId?: number;
  username?: string;
  fullName?: string;
  assignedAdminId?: number;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  lastMessage?: ChatMessage;
}

export interface GuestStartChatRequest {
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  guestDepartment?: string;
  message: string;
}

export interface SendMessageRequest {
  conversationId: number;
  content: string;
  guestToken?: string;
}
