import React, { useState, useEffect } from 'react';
import { X, Sparkles, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AiChatWindow } from './AiChatWindow';
import { useAiStream } from '../hooks/useAiStream';
import { AiTutorMascotIcon } from './AiTutorMascotIcon';

export const AiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBubbleDismissed, setIsBubbleDismissed] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const navigate = useNavigate();
  const streamState = useAiStream();

  useEffect(() => {
    const dismissed = localStorage.getItem('lela_ai_tutor_dismissed');
    if (!dismissed) {
      setIsBubbleDismissed(false);
    }
  }, []);

  const handleDismissBubble = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBubbleDismissed(true);
    localStorage.setItem('lela_ai_tutor_dismissed', 'true');
  };

  const toggleOpen = () => {
    if (!isBubbleDismissed) {
      setIsBubbleDismissed(true);
      localStorage.setItem('lela_ai_tutor_dismissed', 'true');
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-[92px] right-4 md:bottom-[100px] md:right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* AI Chat Window Panel */}
      {isOpen && (
        <div className="pointer-events-auto mb-4 w-[calc(100vw-32px)] sm:w-[420px] h-[580px] max-h-[82vh] bg-white shadow-2xl rounded-2xl overflow-hidden border-[3px] border-black flex flex-col transition-all transform origin-bottom-right brutal-box">
          {/* Header */}
          <div className="bg-[#1D2A3A] text-white p-3.5 flex items-center justify-between border-b-[3px] border-black">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFD700] border-[2px] border-black flex items-center justify-center shrink-0">
                <AiTutorMascotIcon size={26} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-black text-lg text-white leading-none">
                  <span>AI Tutor</span>
                  <Sparkles className="w-4 h-4 text-[#FFD700]" />
                </div>
                <span className="text-xs font-bold text-gray-300">Trợ lý học tiếng Anh LeLa</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai-chat');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#2A8B9D] hover:bg-[#206f7e] text-white text-xs font-bold transition-colors border border-black flex items-center gap-1 shadow-[1px_1px_0px_0px_#000]"
                title="Mở toàn màn hình AI Chat"
              >
                <span>Toàn màn hình</span>
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/20"
                aria-label="Đóng AI Tutor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Window Body */}
          <div className="flex-1 overflow-hidden">
            <AiChatWindow isWidget={true} {...streamState} />
          </div>
        </div>
      )}

      {/* Speech Bubble for First Time User */}
      {!isOpen && !isBubbleDismissed && (
        <div className="pointer-events-auto mb-3 animate-bounce">
          <div className="bg-[#FFD700] text-[#1D2A3A] border-[2.5px] border-black px-4 py-2.5 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-xs font-black flex items-center gap-2 relative">
            <span>👋 Cần hỗ trợ học tiếng Anh không?</span>
            <button
              onClick={handleDismissBubble}
              className="hover:text-red-600 transition-colors ml-1 font-bold text-sm"
              title="Đóng"
            >
              ×
            </button>
            {/* Speech Bubble Arrow */}
            <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-black" />
          </div>
        </div>
      )}

      {/* Floating Button Container with Desktop Hover Tooltip */}
      <div className="pointer-events-auto relative flex items-center">
        {/* Desktop Tooltip */}
        {!isOpen && showTooltip && (
          <div className="hidden md:block absolute right-full mr-3 whitespace-nowrap bg-[#1D2A3A] text-white font-black text-xs px-3 py-2 rounded-xl border-[2px] border-black shadow-[2px_2px_0px_0px_#000] pointer-events-none">
            AI Tutor – Trợ lý học tập
          </div>
        )}

        {/* Floating AI Button */}
        <button
          onClick={toggleOpen}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label="Mở AI Tutor - Trợ lý học tiếng Anh"
          className="w-14 h-14 md:w-16 md:h-16 bg-[#F05A4A] hover:bg-[#d94f41] rounded-full text-white flex items-center justify-center border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:scale-105 hover:-translate-y-1 transition-all relative group"
        >
          {/* Badge Glow */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FFD700] border border-black" />
          </span>

          {isOpen ? (
            <X className="w-7 h-7 text-white" />
          ) : (
            <AiTutorMascotIcon size={34} />
          )}
        </button>
      </div>
    </div>
  );
};
