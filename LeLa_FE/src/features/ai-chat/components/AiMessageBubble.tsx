import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AiMessage } from '../types/ai.types';
import { Bot, User, Copy, RefreshCw } from 'lucide-react';

interface AiMessageBubbleProps {
  message: AiMessage;
  isGenerating?: boolean;
  onRegenerate?: () => void;
}

export const AiMessageBubble: React.FC<AiMessageBubbleProps> = ({ message, isGenerating, onRegenerate }) => {
  const isAi = message.role === 'ai';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <div className={`flex w-full mb-6 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-2 border-brand-black shadow-sm ${isAi ? 'bg-brand-purple mr-3' : 'bg-brand-coral ml-3'}`}>
          {isAi ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
        </div>

        {/* Message Content */}
        <div className="flex flex-col group min-w-[100px]">
          <div className={`px-4 py-3 rounded-2xl border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isAi ? 'bg-white rounded-tl-none' : 'bg-brand-coral text-white rounded-tr-none'}`}>
            {isAi ? (
              <div className="prose prose-sm max-w-none text-gray-800 prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                {message.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div className="flex space-x-1 py-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm font-medium whitespace-pre-wrap">{message.content}</div>
            )}
          </div>

          {/* Quick Actions (Copy, Regenerate) */}
          {isAi && !isGenerating && message.content && (
            <div className="flex items-center gap-2 mt-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={handleCopy} className="text-gray-500 hover:text-brand-purple flex items-center gap-1 text-xs font-bold" title="Sao chép">
                <Copy className="w-3 h-3" /> Copy
              </button>
              {onRegenerate && (
                <button onClick={onRegenerate} className="text-gray-500 hover:text-brand-purple flex items-center gap-1 text-xs font-bold" title="Tạo lại câu trả lời">
                  <RefreshCw className="w-3 h-3" /> Thử lại
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
