import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
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

  // Tự động khôi phục chat nếu đã có conversation
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[350px] h-[500px] shadow-2xl rounded-lg overflow-hidden border border-gray-200 transition-all transform origin-bottom-right">
          {!user && !conversation ? (
            <GuestChatForm onSubmit={handleGuestSubmit} isLoading={isInitializing} />
          ) : (
            <ChatWindow 
              messages={messages} 
              onSendMessage={sendMessage} 
              isConnected={isConnected}
              currentUserRole={user ? 'LEARNER' : 'GUEST'}
              title="Hỗ trợ trực tuyến LeLa"
              onClose={() => setIsOpen(false)}
            />
          )}
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-orange-500 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-orange-600 transition-transform hover:scale-110"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
      </button>
    </div>
  );
};
