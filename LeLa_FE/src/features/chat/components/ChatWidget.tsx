import React, { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { GuestChatForm } from './GuestChatForm';
import { ChatWindow } from './ChatWindow';
import { useWebSocketChat } from '../hooks/useWebSocketChat';
import { chatApi } from '../api/chat.api';
import { useAuth } from '../../../shared/providers/AuthProvider';
import type { ChatConversation } from '../types/chat.types';

export interface ChatWidgetProps {
  hidden?: boolean;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ hidden = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { user } = useAuth();
  
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const guestToken = localStorage.getItem('guestChatToken') || undefined;

  // Listen for programmatic open trigger from AI Tutor "Hỗ trợ LeLa"
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-lela-support', handleOpen);
    return () => window.removeEventListener('open-lela-support', handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen && !conversation) {
      if (user) {
        initLearnerChat();
      } else if (guestToken) {
        restoreGuestChat(guestToken);
      }
    }
  }, [isOpen, user, conversation, guestToken]);

  const initLearnerChat = async () => {
    setIsInitializing(true);
    try {
      const res = await chatApi.startLearnerChat();
      setConversation(res.data);
    } catch (err) {
      console.error(err);
    }
    setIsInitializing(false);
  };

  const restoreGuestChat = async (token: string) => {
    setIsInitializing(true);
    try {
      const res = await chatApi.getGuestConversation(token);
      setConversation(res.data);
    } catch (err) {
      console.error(err);
      localStorage.removeItem('guestChatToken');
    }
    setIsInitializing(false);
  };

  const handleGuestSubmit = async (data: any) => {
    setIsInitializing(true);
    try {
      const res = await chatApi.startGuestChat(data);
      localStorage.setItem('guestChatToken', res.data.guestToken!);
      setConversation(res.data);
    } catch (err) {
      console.error(err);
    }
    setIsInitializing(false);
  };

  const { messages, isConnected, sendMessage } = useWebSocketChat(
    conversation?.id || null, 
    user ? undefined : guestToken
  );

  if (hidden && !isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] lg:bottom-[calc(16px+env(safe-area-inset-bottom))] right-4 z-30 flex flex-col items-end pointer-events-none">
      {/* Help Panel Window */}
      {isOpen && (
        <div className="pointer-events-auto mb-3 w-[calc(100vw-32px)] sm:w-[380px] h-[520px] max-h-[calc(100vh-140px)] transition-all transform origin-bottom-right duration-200 shadow-[var(--shadow-md)] rounded-[var(--radius-card)] overflow-hidden border border-[var(--border)]">
          {!user && !conversation ? (
            <GuestChatForm onSubmit={handleGuestSubmit} isLoading={isInitializing} />
          ) : (
            <ChatWindow 
              messages={messages} 
              onSendMessage={sendMessage} 
              isConnected={isConnected}
              currentUserRole={user ? 'LEARNER' : 'GUEST'}
              title="Hỗ trợ học tập LeLa"
              onClose={() => setIsOpen(false)}
              isLoading={isInitializing}
            />
          )}
        </div>
      )}
      
      {/* Unified Floating Live Chat Button (52px round brand button) */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Đóng hộp trò chuyện" : "Mở trò chuyện hỗ trợ"}
        title="Trò chuyện hỗ trợ"
        className="pointer-events-auto w-[52px] h-[52px] rounded-full bg-[var(--brand)] hover:bg-[var(--brand-600)] text-[#2A1300] shadow-[var(--shadow-md)] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer btn-shine"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-[#2A1300] shrink-0" />
        ) : (
          <MessageSquare className="w-6 h-6 text-[#2A1300] shrink-0" />
        )}
      </button>
    </div>
  );
};
