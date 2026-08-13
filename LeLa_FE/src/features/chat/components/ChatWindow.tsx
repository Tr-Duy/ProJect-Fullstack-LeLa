import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { ChatMessage, SenderType } from '../types/chat.types';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  currentUserRole?: 'GUEST' | 'LEARNER' | 'ADMIN';
  isConnected: boolean;
  title?: string;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onSendMessage, 
  currentUserRole = 'GUEST',
  isConnected,
  title = 'Hỗ trợ trực tuyến',
  onClose
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && isConnected) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const isMyMessage = (senderType: SenderType) => {
    if (currentUserRole === 'ADMIN') return senderType === 'ADMIN';
    return senderType === 'GUEST' || senderType === 'LEARNER';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="bg-orange-500 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-xs opacity-90 flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
            {isConnected ? 'Đang hoạt động' : 'Vắng mặt'}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="hover:bg-orange-600 p-1 rounded">
            ✕
          </button>
        )}
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        {messages.map((msg, idx) => {
          const mine = isMyMessage(msg.senderType);
          return (
            <div key={msg.id || idx} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 rounded-lg ${mine ? 'bg-orange-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <div className={`text-[10px] mt-1 ${mine ? 'text-orange-100' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isConnected}
            placeholder="Nhập tin nhắn..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
          <button 
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
