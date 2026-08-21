import React, { useState } from 'react';
import { HelpCircle, Search } from 'lucide-react';

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
    'Cách bắt đầu học bộ thẻ',
    'Kiểm tra trình độ TOEIC',
    'Cách tính điểm và thi Level',
    'Quên mật khẩu / Tài khoản',
    'Thông tin gói học',
    'Liên hệ Admin hỗ trợ'
  ];

  const handleSelectQuickQuestion = (q: string) => {
    setFormData((prev) => ({
      ...prev,
      guestName: prev.guestName || 'Học viên quan tâm',
      guestPhone: prev.guestPhone || '0900000000',
      message: `Tôi muốn hỏi về: ${q}`
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName.trim()) {
      setError('Vui lòng nhập họ tên của bạn');
      return;
    }
    if (!formData.guestPhone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }
    if (!formData.message.trim()) {
      setError('Vui lòng nhập nội dung thắc mắc');
      return;
    }
    setError('');
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white font-sans text-slate-800 rounded-[22px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-200/80">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#F05A4A] to-[#FF6B5B] text-white p-3.5 px-4.5 flex items-center gap-3 shrink-0 shadow-sm">
        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shrink-0 border border-white/30 shadow-inner">
          <HelpCircle className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h3 className="font-bold text-base md:text-lg text-white leading-tight tracking-tight">
            Trợ giúp LeLa
          </h3>
          <p className="text-xs text-white/90 font-medium mt-0.5">Nhập thông tin để nhận hướng dẫn sử dụng</p>
        </div>
      </div>
      
      {/* Form Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#F8FAFC] text-xs">
        {error && (
          <div className="text-red-600 font-medium text-xs bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-1.5">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Quick Questions 1-Click */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Chủ đề thường gặp (1-click):</label>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectQuickQuestion(q)}
                className="text-[11px] font-semibold bg-white hover:bg-orange-50 text-slate-700 hover:text-[#F05A4A] px-3 py-1.5 rounded-xl border border-slate-200 hover:border-orange-300 transition-all text-left shadow-2xs cursor-pointer"
              >
                + {q}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Họ tên *</label>
          <input 
            type="text" 
            value={formData.guestName}
            onChange={e => setFormData({...formData, guestName: e.target.value})}
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#F05A4A] focus:ring-2 focus:ring-orange-500/20 transition-all"
            placeholder="Nhập họ tên..."
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại *</label>
          <input 
            type="text" 
            value={formData.guestPhone}
            onChange={e => setFormData({...formData, guestPhone: e.target.value})}
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#F05A4A] focus:ring-2 focus:ring-orange-500/20 transition-all"
            placeholder="Nhập số điện thoại..."
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung câu hỏi *</label>
          <textarea 
            value={formData.message}
            onChange={e => setFormData({...formData, message: e.target.value})}
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#F05A4A] focus:ring-2 focus:ring-orange-500/20 transition-all h-20 resize-none"
            placeholder="Nhập nội dung cần hỗ trợ về LeLa..."
          />
        </div>
      </div>
      
      {/* Submit Action */}
      <div className="p-3.5 border-t border-slate-100 bg-white shrink-0">
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-[#F05A4A] hover:bg-[#d94a3a] active:scale-98 text-white font-bold rounded-full py-2.5 px-4 text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang gửi...
            </span>
          ) : (
            <>
              <Search className="w-4 h-4" /> Gửi câu hỏi trợ giúp
            </>
          )}
        </button>
      </div>
    </form>
  );
};
