import React from 'react';
import { Flame, Trophy, CheckCircle, Sparkles } from 'lucide-react';

export const DailyLearningSection: React.FC = () => {
  return (
    <section className="w-full py-20 bg-[#F4F3EE] border-b-[3px] border-black">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Text */}
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 bg-[#F05A4A] text-white font-black uppercase text-xs px-4 py-1.5 rounded-full border-[2px] border-black shadow-[2px_2px_0px_0px_#000]">
              <Flame className="w-4 h-4" /> THÓI QUEN MỖI NGÀY
            </span>

            <h2 className="text-3xl md:text-5xl font-black uppercase text-[#1D2A3A] tracking-tight leading-tight">
              Học Một Chút Mỗi Ngày. Tiến Bộ Lâu Dài.
            </h2>

            <p className="text-base md:text-lg font-medium text-gray-700 leading-relaxed">
              Bạn không cần dành ra 2-3 tiếng dồn dập. Chỉ cần 10-15 phút học Flashcard mỗi ngày cùng LeLa để duy trì chuỗi Streak và nhận điểm thưởng XP.
            </p>

            <div className="space-y-3 w-full">
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-[2px] border-black shadow-[2px_2px_0px_0px_#000]">
                <Flame className="w-6 h-6 text-[#F05A4A] shrink-0" />
                <div>
                  <h4 className="font-black text-sm uppercase text-[#1D2A3A] m-0">Streak – Chuỗi ngày liên tục</h4>
                  <p className="text-xs text-gray-600 font-medium m-0">Tạo động lực duy trì việc học không gián đoạn.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-[2px] border-black shadow-[2px_2px_0px_0px_#000]">
                <Trophy className="w-6 h-6 text-[#FFD700] shrink-0" />
                <div>
                  <h4 className="font-black text-sm uppercase text-[#1D2A3A] m-0">XP & Bảng Xếp Hạng</h4>
                  <p className="text-xs text-gray-600 font-medium m-0">Tích lũy kinh nghiệm và thi đua cùng cộng đồng người học LeLa.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual Dashboard Mock */}
          <div className="bg-white border-[3px] border-black rounded-[28px] p-6 md:p-8 shadow-[8px_8px_0px_0px_#000] flex flex-col gap-6">
            <div className="flex items-center justify-between border-b-[2px] border-black pb-4">
              <div>
                <h3 className="font-black uppercase text-lg text-[#1D2A3A] m-0">Tiến độ hôm nay</h3>
                <span className="text-xs text-gray-500 font-bold">Thứ Hai, Ngày 10 Tháng 8</span>
              </div>
              <div className="flex items-center gap-2 bg-[#FFD700] px-3 py-1.5 rounded-full border-[2px] border-black font-black text-xs">
                <span>🔥 7 Ngày Streak</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F4F3EE] p-4 rounded-xl border-[2px] border-black text-center">
                <span className="text-2xl font-black text-[#F05A4A] block">+420</span>
                <span className="text-xs font-bold text-gray-600 uppercase">XP Đã Nhận</span>
              </div>

              <div className="bg-[#F4F3EE] p-4 rounded-xl border-[2px] border-black text-center">
                <span className="text-2xl font-black text-[#2A8B9D] block">32</span>
                <span className="text-xs font-bold text-gray-600 uppercase">Từ Vựng Đã Ôn</span>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border-[2px] border-black flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="font-bold text-sm text-[#1D2A3A]">Đã hoàn thành mục tiêu ngày!</span>
              </div>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
