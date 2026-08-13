import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AiMessage } from '../types/ai.types';
import { AiMessageBubble } from './AiMessageBubble';
import { QuickActions } from './QuickActions';
import { Send, StopCircle, BookOpen } from 'lucide-react';
import { profileApi } from '../../users/api/profile.api';
import { AiTutorMascotIcon } from './AiTutorMascotIcon';

export interface AiChatWindowProps {
  className?: string;
  isWidget?: boolean;
  messages: AiMessage[];
  isLoading: boolean;
  isGenerating?: boolean;
  error: string | null;
  sendMessage: (text: string) => void;
  stopGeneration: () => void;
}

export const AiChatWindow: React.FC<AiChatWindowProps> = ({
  className = '',
  isWidget = false,
  messages,
  isLoading,
  isGenerating = false,
  error,
  sendMessage,
  stopGeneration,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: profileResponse } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getMe,
    staleTime: 5 * 60 * 1000,
  });

  const currentLevelName = profileResponse?.data?.currentLevel?.name;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim() && !isGenerating) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating) {
        handleSubmit();
      }
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#F4F3EE] ${className}`}>
      {/* Context Awareness Bar */}
      {currentLevelName && (
        <div className="bg-[#FFD700] text-[#1D2A3A] px-4 py-1.5 border-b-[2px] border-black text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#1D2A3A]" />
            Trình độ hiện tại:
          </span>
          <span className="font-black border-b border-black">{currentLevelName}</span>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 bg-white rounded-full border-[3px] border-black brutal-shadow flex items-center justify-center mb-3">
              <AiTutorMascotIcon size={40} />
            </div>

            <h3 className="text-xl font-black text-[#1D2A3A] mb-1">
              AI Tutor – Trợ lý học tập LeLa
            </h3>
            <p className="text-gray-600 text-sm font-medium mb-4 max-w-xs">
              Hỏi tôi về từ vựng, ngữ pháp hoặc các câu tiếng Anh trong bài học!
            </p>

            <div className="w-full max-w-sm">
              <p className="text-xs font-bold uppercase text-gray-500 mb-2">Bạn muốn học gì hôm nay?</p>
              <QuickActions onSelectAction={(prompt) => sendMessage(prompt)} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((msg) => (
              <AiMessageBubble
                key={msg.id}
                message={msg}
                onRegenerate={() => {
                  if (isGenerating) return;
                  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
                  if (lastUserMessage) sendMessage(lastUserMessage.content);
                }}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border-[2px] border-black shadow-[2px_2px_0px_0px_#000] text-[#1D2A3A] font-bold text-xs flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#F05A4A] rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-[#F05A4A] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-2 h-2 bg-[#F05A4A] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                  AI Tutor đang suy nghĩ...
                </div>
              </div>
            )}
            {error && (
              <div className="mx-auto bg-red-100 text-red-700 px-4 py-3 rounded-lg text-xs border-[2px] border-red-400 font-bold mb-4 flex flex-col items-center gap-2">
                <div>{error}</div>
                <button
                  onClick={() => {
                    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
                    if (lastUserMessage) sendMessage(lastUserMessage.content);
                  }}
                  className="px-3 py-1 bg-[#F05A4A] text-white rounded font-black hover:bg-[#d94f41] transition-colors"
                >
                  Thử lại
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t-[2px] border-black">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGenerating ? 'AI Tutor đang trả lời...' : 'Hỏi AI Tutor...'}
            className={`w-full pl-4 pr-12 py-2.5 rounded-xl border-[2px] border-black shadow-[2px_2px_0px_0px_#000] focus:outline-none focus:ring-2 focus:ring-[#2A8B9D] resize-none text-sm font-medium ${
              isGenerating ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
            }`}
            rows={isWidget ? 1 : 2}
            disabled={isGenerating}
          />
          {isGenerating ? (
            <button
              type="button"
              onClick={stopGeneration}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 transition-colors p-1"
              title="Dừng tạo phản hồi"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F05A4A] hover:text-[#1D2A3A] disabled:opacity-30 transition-colors p-1"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
