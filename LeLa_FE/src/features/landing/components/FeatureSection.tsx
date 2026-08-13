import React from 'react';
import { BookMarked, Brain, FileCheck2, Compass, Bot, Flame } from 'lucide-react';

export const FeatureSection: React.FC = () => {
  const features = [
    {
      icon: BookMarked,
      title: 'FLASHCARD THÔNG MINH',
      desc: 'Học từ vựng trực quan với hình ảnh, phát âm chuẩn voice AI và ví dụ minh họa dễ hiểu.',
      color: 'bg-[#2A8B9D]',
    },
    {
      icon: Brain,
      title: 'ÔN TẬP SRS (SPACED REPETITION)',
      desc: 'Thuật toán lặp lại ngắt quãng tự động tính toán thời điểm ôn lại từ ngay trước khi bạn quên.',
      color: 'bg-[#F05A4A]',
    },
    {
      icon: FileCheck2,
      title: 'QUIZ & ĐÁNH GIÁ',
      desc: 'Kiểm tra mức độ ghi nhớ sau mỗi bài học với các dạng câu hỏi đa dạng và bài kiểm tra cấp độ.',
      color: 'bg-[#FFD700]',
    },
    {
      icon: Compass,
      title: 'HỌC THEO TRÌNH ĐỘ',
      desc: 'Nội dung phân cấp rõ ràng từ Cơ bản (A1) đến Xuất sắc (C2), tương ứng với điểm số TOEIC.',
      color: 'bg-[#1D2A3A]',
    },
    {
      icon: Bot,
      title: 'TRỢ LÝ AI TUTOR',
      desc: 'Giải đáp từ vựng, sửa lỗi câu tiếng Anh, dịch thuật và hỗ trợ luyện hội thoại trực tiếp 24/7.',
      color: 'bg-[#9B51E0]',
    },
    {
      icon: Flame,
      title: 'THEO DÕI STREAK & XP',
      desc: 'Duy trì chuỗi ngày học liên tục và tích lũy XP để tạo thói quen học tập bền vững mỗi ngày.',
      color: 'bg-[#FF9900]',
    },
  ];

  return (
    <section className="w-full py-20 bg-white border-b-[3px] border-black">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-[#F05A4A] text-white font-black uppercase text-xs px-4 py-1.5 rounded-full border-[2px] border-black shadow-[2px_2px_0px_0px_#000] mb-4">
            TÍNH NĂNG NỔI BẬT
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-[#1D2A3A] tracking-tight mb-4">
            Mọi Thứ Bạn Cần Để Giỏi Tiếng Anh
          </h2>
          <p className="text-lg font-medium text-gray-700 leading-relaxed">
            Không cần tải quá nhiều ứng dụng rời rạc. LeLa tích hợp đầy đủ công cụ học từ vựng, luyện tập và AI hỗ trợ trong một giao diện duy nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-[#F4F3EE] p-6 border-[2px] border-black rounded-[22px] shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 transition-transform flex flex-col justify-between"
              >
                <div>
                  <div className={`w-14 h-14 ${item.color} border-[2px] border-black shadow-[2px_2px_0px_0px_#000] rounded-2xl flex items-center justify-center text-white mb-6`}>
                    <Icon className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <h3 className="text-xl font-black uppercase text-[#1D2A3A] mb-3 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-gray-700 font-medium text-base leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
