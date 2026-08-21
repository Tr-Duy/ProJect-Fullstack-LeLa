import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Search, Send, BookOpen, ChevronRight, ArrowLeft } from 'lucide-react';
import type { ChatMessage, SenderType } from '../types/chat.types';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  currentUserRole?: 'GUEST' | 'LEARNER' | 'ADMIN';
  isConnected: boolean;
  title?: string;
  onClose?: () => void;
  isLoading?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onSendMessage, 
  currentUserRole = 'GUEST',
  isConnected,
  title = 'Trợ giúp LeLa',
  onClose,
  isLoading = false
}) => {
  const [input, setInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && isConnected) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleTopicQuestionClick = (question: string) => {
    if (isConnected) {
      onSendMessage(question);
    } else {
      setInput(question);
    }
  };

  const isMyMessage = (senderType: SenderType) => {
    if (currentUserRole === 'ADMIN') return senderType === 'ADMIN';
    return senderType === 'GUEST' || senderType === 'LEARNER';
  };

  // Pre-configured Mini Help Center Categories & Topics
  const helpCategories = [
    {
      id: 'learning',
      title: 'Học tập & Bộ thẻ',
      icon: '📚',
      description: 'Bộ thẻ từ vựng, SRS & ôn tập',
      topics: [
        { title: 'Cách bắt đầu học một bộ thẻ từ vựng?', query: 'Cách bắt đầu học một bộ thẻ từ vựng?' },
        { title: 'Hệ thống lặp lại ngắt quãng (SRS) hoạt động thế nào?', query: 'Giải thích hệ thống lặp lại SRS' },
        { title: 'Làm thế nào để theo dõi tiến độ thẻ từ?', query: 'Cách xem tiến độ thẻ từ' },
      ]
    },
    {
      id: 'exams',
      title: 'Bài thi & Trình độ',
      icon: '🎯',
      description: 'Bài kiểm tra trình độ & thi Level',
      topics: [
        { title: 'Điều kiện tham gia Bài thi kết thúc Level?', query: 'Điều kiện tham gia Bài thi kết thúc Level là gì?' },
        { title: 'Cách tính điểm TOEIC ước lượng?', query: 'Cách tính điểm TOEIC trên LeLa' },
        { title: 'Thời gian chờ cooldown khi làm lại bài thi?', query: 'Thời gian chờ cooldown khi làm lại bài thi' },
      ]
    },
    {
      id: 'account',
      title: 'Tài khoản & Thiết lập',
      icon: '👤',
      description: 'Đổi level, mục tiêu & thông tin cá nhân',
      topics: [
        { title: 'Làm thế nào để đổi trình độ TOEIC đang học?', query: 'Làm thế nào để đổi trình độ TOEIC?' },
        { title: 'Cách cập nhật mục tiêu học hàng ngày?', query: 'Cách đổi mục tiêu bài học hàng ngày' },
        { title: 'Cách xem thành tích và danh hiệu?', query: 'Cách xem thành tích và danh hiệu' },
      ]
    },
    {
      id: 'general',
      title: 'Trợ giúp chung',
      icon: '⚙️',
      description: 'Tính năng hệ thống & liên hệ',
      topics: [
        { title: 'Sử dụng LeLa trên thiết bị di động?', query: 'Sử dụng LeLa trên thiết bị di động' },
        { title: 'Cách liên hệ Admin khi gặp lỗi hệ thống?', query: 'Cách liên hệ Admin khi gặp sự cố' },
      ]
    }
  ];

  const activeCategoryObj = helpCategories.find(c => c.id === selectedTopic);

  return (
    <div className="flex flex-col h-full bg-white font-sans text-slate-800 rounded-[22px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-200/80">
      {/* Help Panel Header */}
      <div className="bg-gradient-to-r from-[#F05A4A] to-[#FF6B5B] text-white p-3.5 px-4.5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shrink-0 border border-white/30 shadow-inner">
            <HelpCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-bold text-base md:text-lg text-white leading-tight tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-white/90 font-medium mt-0.5">
              Giải đáp & hướng dẫn sử dụng
            </p>
          </div>
        </div>

        {onClose && (
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors border border-transparent hover:border-white/20 cursor-pointer"
            aria-label="Đóng cửa sổ trợ giúp"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
      
      {/* Help Panel Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F8FAFC]">
        {!isConnected && (
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs text-amber-800 font-medium shadow-2xs">
            <span>⚠️ Đang kết nối hệ thống trợ giúp...</span>
          </div>
        )}

        {/* Initial Help Center Overview */}
        {messages.length === 0 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Welcome banner */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5 text-[#F05A4A] font-bold text-sm">
                <BookOpen className="w-4 h-4" />
                <span>Trung tâm trợ giúp LeLa</span>
              </div>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                Chọn danh mục dưới đây hoặc nhập câu hỏi để tìm hướng dẫn thao tác trên hệ thống LeLa:
              </p>
            </div>

            {/* Selected Topic Detailed List */}
            {selectedTopic && activeCategoryObj ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                <button
                  type="button"
                  onClick={() => setSelectedTopic(null)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#F05A4A] hover:underline mb-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh mục
                </button>
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                  <span>{activeCategoryObj.icon}</span>
                  <span>{activeCategoryObj.title}</span>
                </div>
                <div className="space-y-2 pt-1">
                  {activeCategoryObj.topics.map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleTopicQuestionClick(t.query)}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-orange-50/80 border border-slate-200/80 hover:border-orange-300 text-xs md:text-sm font-medium text-slate-700 hover:text-[#F05A4A] flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <span>{t.title}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#F05A4A] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Categories Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {helpCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedTopic(cat.id)}
                    className="bg-white hover:bg-orange-50/80 border border-slate-200 hover:border-orange-300 rounded-2xl p-3.5 text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{cat.icon}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#F05A4A]" />
                    </div>
                    <h4 className="font-bold text-xs md:text-sm text-slate-800 group-hover:text-[#F05A4A]">
                      {cat.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5 line-clamp-1">
                      {cat.description}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Help Questions & System Answer Guides */}
        {messages.map((msg, idx) => {
          const mine = isMyMessage(msg.senderType);

          return (
            <div key={msg.id || idx} className="space-y-1">
              {mine ? (
                /* User Question Block */
                <div className="flex justify-end my-2">
                  <div className="bg-slate-200 text-slate-800 rounded-2xl rounded-tr-xs px-4 py-2 text-xs md:text-sm font-semibold max-w-[85%] shadow-2xs">
                    <span className="text-[10px] uppercase font-black text-slate-500 block mb-0.5">Câu hỏi của bạn:</span>
                    {msg.content}
                  </div>
                </div>
              ) : (
                /* System Guidance Card */
                <div className="my-3 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 text-[#F05A4A] font-bold text-xs">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>HƯỚNG DẪN HỆ THỐNG LELA</span>
                  </div>
                  <div className="text-xs md:text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading State */}
        {isLoading && (
          <div className="my-3 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center gap-2 text-[#F05A4A] font-bold text-xs">
              <span className="w-3 h-3 border-2 border-[#F05A4A] border-t-transparent rounded-full animate-spin" />
              <span>Đang tra cứu hướng dẫn hệ thống...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Bottom Search Input Bar */}
      <div className="p-3 md:p-3.5 border-t border-slate-100 bg-white shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-slate-100/80 focus-within:bg-white border border-slate-200 focus-within:border-[#F05A4A] focus-within:ring-2 focus-within:ring-orange-500/20 rounded-full px-4 py-1.5 transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isConnected}
            placeholder="Nhập câu hỏi về LeLa..."
            className="flex-1 bg-transparent text-slate-800 placeholder:text-slate-400 text-xs md:text-sm focus:outline-none py-1.5 font-medium"
          />
          <button 
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="w-9 h-9 rounded-full bg-[#F05A4A] hover:bg-[#d94a3a] active:scale-95 disabled:opacity-35 text-white flex items-center justify-center shrink-0 transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:cursor-not-allowed"
            title="Tìm hướng dẫn"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
