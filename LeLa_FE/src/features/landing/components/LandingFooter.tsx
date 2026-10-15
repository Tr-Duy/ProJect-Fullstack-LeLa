import React from 'react';
import { Link } from 'react-router-dom';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#FDFBF7] py-16 border-t-2 border-black text-[#18181B] relative">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="footer-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#18181B" strokeWidth="1" opacity="0.06" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-grid)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Col 1: Brand */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src="/images/lela_fox_logo.png"
                alt="LeLa Fox Logo"
                width="40"
                height="40"
                loading="lazy"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-2xl font-black tracking-tight text-[#FF5733]">LeLa</span>
          </div>
          <p className="text-sm font-medium text-gray-600 leading-relaxed">
            Nền tảng học tiếng Anh bằng Flashcard thông minh (SRS) & Trợ lý AI Tutor. Học ít hơn, nhớ lâu hơn.
          </p>
          <div className="text-xs font-bold text-gray-500">
            © 2026 LeLa EdTech Platform. All rights reserved.
          </div>
        </div>

        {/* Col 2: Sản phẩm */}
        <div className="flex flex-col gap-3">
          <h4 className="font-black uppercase text-sm text-[#18181B] tracking-wider mb-1">Sản Phẩm</h4>
          <Link to="/decks" className="font-semibold text-sm text-gray-600 hover:text-[#FF5733] transition-colors">Khám phá bộ thẻ</Link>
          <Link to="/ai-chat" className="font-semibold text-sm text-gray-600 hover:text-[#FF5733] transition-colors">AI Tutor cá nhân</Link>
          <Link to="/placement-tests" className="font-semibold text-sm text-gray-600 hover:text-[#FF5733] transition-colors">Kiểm tra trình độ</Link>
          <Link to="/leaderboard" className="font-semibold text-sm text-gray-600 hover:text-[#FF5733] transition-colors">Bảng xếp hạng</Link>
        </div>

        {/* Col 3: Hỗ trợ */}
        <div className="flex flex-col gap-3">
          <h4 className="font-black uppercase text-sm text-[#18181B] tracking-wider mb-1">Hỗ Trợ</h4>
          <Link to="/pricing" className="font-semibold text-sm text-gray-600 hover:text-[#FF5733] transition-colors">Bảng giá gói học</Link>
          <span className="font-semibold text-sm text-gray-600 hover:text-[#FF5733] transition-colors cursor-pointer">Hướng dẫn sử dụng</span>
          <span className="font-semibold text-sm text-gray-600 hover:text-[#FF5733] transition-colors cursor-pointer">Câu hỏi thường gặp</span>
          <span className="font-semibold text-sm text-gray-600 hover:text-[#FF5733] transition-colors cursor-pointer">Liên hệ Admin</span>
        </div>

        {/* Col 4: Tài khoản */}
        <div className="flex flex-col gap-3">
          <h4 className="font-black uppercase text-sm text-[#18181B] tracking-wider mb-1">Tài Khoản</h4>
          <Link to="/login" className="font-semibold text-sm text-gray-600 hover:text-[#FF5733] transition-colors">Đăng nhập</Link>
          <Link to="/register" className="font-semibold text-sm text-gray-600 hover:text-[#FF5733] transition-colors">Đăng ký tài khoản mới</Link>
          <Link to="/profile" className="font-semibold text-sm text-gray-600 hover:text-[#FF5733] transition-colors">Hồ sơ cá nhân</Link>
        </div>
      </div>
    </footer>
  );
};
export default LandingFooter;
