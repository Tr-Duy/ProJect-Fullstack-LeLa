import React from 'react';
import { Link } from 'react-router-dom';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="w-full bg-white py-16 border-t-[3px] border-black text-[#1D2A3A]">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Col 1: Brand */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/images/lela_fox_logo.png" alt="LeLa Fox Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black tracking-tight text-[#1D2A3A]">LeLa</span>
          </div>
          <p className="text-sm font-medium text-gray-600 leading-relaxed">
            Nền tảng học tiếng Anh bằng Flashcard thông minh (SRS) & Trợ lý AI Tutor. Học ít hơn, nhớ lâu hơn.
          </p>
          <div className="text-xs font-bold text-gray-400">
            © 2026 LeLa EdTech Platform. All rights reserved.
          </div>
        </div>

        {/* Col 2: Sản phẩm */}
        <div className="flex flex-col gap-3">
          <h4 className="font-black uppercase text-sm text-[#1D2A3A] tracking-wider mb-1">Sản Phẩm</h4>
          <Link to="/decks" className="font-semibold text-sm text-gray-600 hover:text-[#F05A4A]">Khám phá bộ thẻ</Link>
          <Link to="/ai-chat" className="font-semibold text-sm text-gray-600 hover:text-[#F05A4A]">AI Tutor cá nhân</Link>
          <Link to="/placement-tests" className="font-semibold text-sm text-gray-600 hover:text-[#F05A4A]">Kiểm tra trình độ</Link>
          <Link to="/leaderboard" className="font-semibold text-sm text-gray-600 hover:text-[#F05A4A]">Bảng xếp hạng</Link>
        </div>

        {/* Col 3: Hỗ trợ */}
        <div className="flex flex-col gap-3">
          <h4 className="font-black uppercase text-sm text-[#1D2A3A] tracking-wider mb-1">Hỗ Trợ</h4>
          <Link to="/pricing" className="font-semibold text-sm text-gray-600 hover:text-[#F05A4A]">Bảng giá gói học</Link>
          <span className="font-semibold text-sm text-gray-600 hover:text-[#F05A4A] cursor-pointer">Hướng dẫn sử dụng</span>
          <span className="font-semibold text-sm text-gray-600 hover:text-[#F05A4A] cursor-pointer">Câu hỏi thường gặp</span>
          <span className="font-semibold text-sm text-gray-600 hover:text-[#F05A4A] cursor-pointer">Liên hệ Admin</span>
        </div>

        {/* Col 4: Tài khoản */}
        <div className="flex flex-col gap-3">
          <h4 className="font-black uppercase text-sm text-[#1D2A3A] tracking-wider mb-1">Tài Khoản</h4>
          <Link to="/login" className="font-semibold text-sm text-gray-600 hover:text-[#F05A4A]">Đăng nhập</Link>
          <Link to="/register" className="font-semibold text-sm text-gray-600 hover:text-[#F05A4A]">Đăng ký khoản mới</Link>
          <Link to="/profile" className="font-semibold text-sm text-gray-600 hover:text-[#F05A4A]">Hồ sơ cá nhân</Link>
        </div>
      </div>
    </footer>
  );
};
