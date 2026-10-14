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

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { messages, isConnected, sendMessage } = useWebSocketChat(
    conversation?.id || null, 
    user ? undefined : guestToken
  );

  return (
    <div className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] lg:bottom-[calc(16px+env(safe-area-inset-bottom))] right-4 z-30 flex flex-col items-end pointer-events-none">
      {/* Help Panel Window */}
      {isOpen && (
        <div className="pointer-events-auto mb-3 w-[calc(100vw-32px)] sm:w-[380px] h-[520px] max-h-[calc(100vh-140px)] transition-all transform origin-bottom-right duration-200">
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
      
      {/* Unified Floating Live Chat Button */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Đóng hỗ trợ LeLa" : "Mở hỗ trợ trực tiếp"}
        title="Hỗ trợ trực tiếp"
        className="pointer-events-auto h-11 px-3.5 bg-[var(--sun)] hover:bg-[#ffe033] text-[var(--ink)] rounded-xl flex items-center gap-2 border-2 border-[var(--ink)] shadow-[3px_3px_0_var(--ink)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer font-bold text-xs"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-[var(--ink)] shrink-0" />
        ) : (
          <HelpCircle className="w-5 h-5 text-[var(--ink)] stroke-[2.5] shrink-0" />
        )}
        {!isOpen && !isScrolled && (
          <span className="font-mono uppercase tracking-wider font-bold hidden sm:inline">
            Trợ giúp
          </span>
        )}
      </button>
    </div>
  );
};
