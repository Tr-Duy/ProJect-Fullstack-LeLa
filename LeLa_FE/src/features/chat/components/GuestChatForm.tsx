import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface GuestChatFormProps {
  onSubmit: (data: { guestName: string; guestEmail?: string; guestPhone: string; guestDepartment?: string; message: string }) => void;
  isLoading: boolean;
}

export const GuestChatForm: React.FC<GuestChatFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestDepartment: '',
    message: ''
  });
  const [error, setError] = useState('');

  const quickQuestions = [
    'Không biết bắt đầu từ đâu',
    'Tôi muốn kiểm tra trình độ',
    'Tôi không biết cách học flashcard',
    'Tôi gặp vấn đề với tài khoản',
    'Tôi cần hỗ trợ thanh toán',
    'Tôi muốn liên hệ Admin'
  ];

  const handleSelectQuickQuestion = (q: string) => {
    setFormData((prev) => ({
      ...prev,
      guestName: prev.guestName || 'Học viên quan tâm',
      guestPhone: prev.guestPhone || '0900000000',
      message: `Tôi muốn hỏi: ${q}`
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName.trim()) {
      setError('Vui lòng nhập họ tên');
      return;
    }
    if (!formData.guestPhone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }
    if (!formData.message.trim()) {
      setError('Vui lòng nhập tin nhắn');
      return;
    }
    setError('');
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
      <div className="bg-[#1D2A3A] text-white p-4 rounded-t-lg border-b-[2px] border-black">
        <h3 className="font-black text-base uppercase m-0 flex items-center gap-2">
          <span>🤖 Hỗ trợ học tiếng Anh LeLa</span>
        </h3>
        <p className="text-xs opacity-80 m-0 mt-1 font-medium">Chọn câu hỏi nhanh hoặc gửi thắc mắc của bạn</p>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
        {error && <div className="text-red-500 font-bold text-xs bg-red-50 p-2 rounded border border-red-200">{error}</div>}

        {/* Quick Questions Section */}
        <div>
          <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Câu hỏi phổ biến (1-click)</label>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectQuickQuestion(q)}
                className="text-[11px] font-bold bg-[#F4F3EE] hover:bg-[#FFD700] text-[#1D2A3A] px-2.5 py-1 rounded-full border border-black transition-colors text-left"
              >
                + {q}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Họ tên *</label>
          <input 
            type="text" 
            value={formData.guestName}
            onChange={e => setFormData({...formData, guestName: e.target.value})}
            className="w-full border border-black rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="Nhập họ tên của bạn"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại *</label>
          <input 
            type="text" 
            value={formData.guestPhone}
            onChange={e => setFormData({...formData, guestPhone: e.target.value})}
            className="w-full border border-black rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="Nhập số điện thoại"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Tin nhắn *</label>
          <textarea 
            value={formData.message}
            onChange={e => setFormData({...formData, message: e.target.value})}
            className="w-full border border-black rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-black h-16 resize-none"
            placeholder="Nhập nội dung cần hỗ trợ..."
          />
        </div>
      </div>
      
      <div className="p-3 border-t border-black bg-[#F4F3EE]">
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-[#F05A4A] hover:bg-[#d94a3a] text-white font-black uppercase rounded-full p-2.5 text-xs flex items-center justify-center gap-2 border border-black shadow-[2px_2px_0px_0px_#000] disabled:opacity-50"
        >
          {isLoading ? 'Đang kết nối...' : (
            <>
              <Send className="w-3.5 h-3.5" /> Bắt đầu trò chuyện
            </>
          )}
        </button>
      </div>
    </form>
  );
};
