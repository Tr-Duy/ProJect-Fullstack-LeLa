import React, { useState, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { GuestChatForm } from './GuestChatForm';
import { ChatWindow } from './ChatWindow';
import { useWebSocketChat } from '../hooks/useWebSocketChat';
import { chatApi } from '../api/chat.api';
import { useAuth } from '../../../shared/providers/AuthProvider';
import type { ChatConversation } from '../types/chat.types';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { user } = useAuth();
  
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const guestToken = localStorage.getItem('guestChatToken') || undefined;

  useEffect(() => {
    if (isOpen && !conversation) {
      if (user) {
        initLearnerChat();
      } else if (guestToken) {
        restoreGuestChat(guestToken);
      }
    }
  }, [isOpen, user]);

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

  return (
    <div className="fixed bottom-6 right-4 md:right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Help Panel Window */}
      {isOpen && (
        <div className="pointer-events-auto mb-4 w-[calc(100vw-32px)] sm:w-[400px] h-[580px] max-h-[calc(100vh-120px)] transition-all transform origin-bottom-right duration-200">
          {!user && !conversation ? (
            <GuestChatForm onSubmit={handleGuestSubmit} isLoading={isInitializing} />
          ) : (
            <ChatWindow 
              messages={messages} 
              onSendMessage={sendMessage} 
              isConnected={isConnected}
              currentUserRole={user ? 'LEARNER' : 'GUEST'}
              title="Trợ giúp LeLa"
              onClose={() => setIsOpen(false)}
              isLoading={isInitializing}
            />
          )}
        </div>
      )}
      
      {/* Floating Help Center Button */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Đóng bảng Trợ giúp LeLa" : "Mở bảng Trợ giúp LeLa"}
        title="Trợ giúp LeLa"
        className="pointer-events-auto w-14 h-14 bg-[#F05A4A] hover:bg-[#d94a3a] rounded-full text-white flex items-center justify-center shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all border border-white/20 relative group cursor-pointer"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <HelpCircle className="w-7 h-7 text-white stroke-[2.5]" />
        )}
      </button>
    </div>
  );
};
