import React from 'react';
import { Target, BookOpen, BrainCircuit, LineChart, ArrowRight } from 'lucide-react';

export const LearningFlow: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'CHỌN TRÌNH ĐỘ',
      desc: 'Xác định trình độ hiện tại từ Cơ bản đến Xuất sắc hoặc làm bài Placement Test để bắt đầu từ mức phù hợp.',
      icon: Target,
      color: 'bg-[#2A8B9D]',
      badge: 'Bắt đầu từ đúng mức',
    },
    {
      step: '02',
      title: 'CHỌN CHỦ ĐỀ',
      desc: 'Khám phá hàng trăm bộ thẻ từ vựng theo chủ đề: Trái cây, Du lịch, Công việc, Giao tiếp hằng ngày...',
      icon: BookOpen,
      color: 'bg-[#FFD700]',
      badge: 'Hàng trăm bộ thẻ',
    },
    {
      step: '03',
      title: 'HỌC & LUYỆN TẬP',
      desc: 'Ghi nhớ bằng Flashcard thông minh (SRS), kiểm tra qua Quiz và luyện nói / dịch thuật cùng AI Tutor.',
      icon: BrainCircuit,
      color: 'bg-[#F05A4A]',
      badge: 'Ghi nhớ gấp 3 lần',
    },
    {
      step: '04',
      title: 'THEO DÕI TIẾN BỘ',
      desc: 'Duy trì chuỗi ngày học Streak, tích lũy điểm XP và nhìn thấy sự tiến bộ rõ rệt qua từng ngày.',
      icon: LineChart,
      color: 'bg-[#1D2A3A]',
      badge: 'Tạo thói quen tốt',
    },
  ];

  return (
    <section className="w-full py-20 bg-[#F4F3EE] border-b-[3px] border-black">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-[#FFD700] text-black font-black uppercase text-xs px-4 py-1.5 rounded-full border-[2px] border-black shadow-[2px_2px_0px_0px_#000] mb-4">
            LỘ TRÌNH RÕ RÀNG
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-[#1D2A3A] tracking-tight mb-4">
            LeLa Giúp Bạn Học Như Thế Nào?
          </h2>
          <p className="text-lg font-medium text-gray-700 leading-relaxed">
            Quy trình 4 bước đơn giản được thiết kế tối ưu cho não bộ, giúp bạn học đúng trình độ và không bao giờ chán.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white brutal-card p-6 border-[2px] border-black rounded-[22px] shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-black text-[#1D2A3A] opacity-30 tracking-tighter">
                      {item.step}
                    </span>
                    <div className={`w-12 h-12 ${item.color} border-[2px] border-black shadow-[2px_2px_0px_0px_#000] rounded-2xl flex items-center justify-center text-white`}>
                      <Icon className="w-6 h-6 stroke-[2.5]" />
                    </div>
                  </div>

                  <h3 className="text-xl font-black uppercase text-[#1D2A3A] mb-2 tracking-tight">
                    {item.title}
                  </h3>

                  <p className="text-gray-600 font-medium text-sm leading-relaxed mb-6">
                    {item.desc}
                  </p>
                </div>

                <div className="border-t-[2px] border-black/10 pt-4 flex items-center justify-between text-xs font-bold text-[#2A8B9D]">
                  <span>{item.badge}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
