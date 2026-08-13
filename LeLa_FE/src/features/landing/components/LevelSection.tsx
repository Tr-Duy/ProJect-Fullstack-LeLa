import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../shared/providers/AuthProvider';

export const LevelSection: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const levels = [
    {
      title: 'CƠ BẢN (BEGINNER)',
      score: 'Dưới 500 TOEIC / A1-A2',
      desc: 'Từ vựng thông dụng cơ bản hằng ngày, cấu trúc câu đơn giản cho người mới bắt đầu.',
      color: 'border-l-[6px] border-l-[#2A8B9D]',
      tagBg: 'bg-[#2A8B9D]',
    },
    {
      title: 'TRUNG CẤP (INTERMEDIATE)',
      score: '500 - 700 TOEIC / B1',
      desc: 'Mở rộng vốn từ học thuật & công sở, diễn đạt ý kiến và đọc hiểu văn bản trung bình.',
      color: 'border-l-[6px] border-l-[#FFD700]',
      tagBg: 'bg-[#FFD700]',
      tagText: 'text-black',
    },
    {
      title: 'KHÁ - GIỎI (ADVANCED)',
      score: '700 - 850 TOEIC / B2',
      desc: 'Từ vựng chuyên sâu theo chủ đề kinh tế, xã hội, phản xạ giao tiếp tự nhiên và thành thạo.',
      color: 'border-l-[6px] border-l-[#F05A4A]',
      tagBg: 'bg-[#F05A4A]',
    },
    {
      title: 'XUẤT SẮC (EXPERT)',
      score: '850 - 990 TOEIC / C1-C2',
      desc: 'Master thành ngữ, cụm từ cố định (collocations) và ngôn ngữ chuẩn bản xứ.',
      color: 'border-l-[6px] border-l-[#1D2A3A]',
      tagBg: 'bg-[#1D2A3A]',
    },
  ];

  return (
    <section className="w-full py-20 bg-white border-b-[3px] border-black">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-[#FFD700] text-black font-black uppercase text-xs px-4 py-1.5 rounded-full border-[2px] border-black shadow-[2px_2px_0px_0px_#000] mb-4">
            LỘ TRÌNH PHÂN CẤP
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-[#1D2A3A] tracking-tight mb-4">
            Học Đúng Trình Độ – Không Quá Dễ, Không Quá Khó
          </h2>
          <p className="text-lg font-medium text-gray-700 leading-relaxed">
            Bạn không cần tự đoán trình độ của mình. LeLa có bài kiểm tra Placement Test giúp phân loại chính xác để đề xuất bộ thẻ phù hợp nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {levels.map((item, idx) => (
            <div
              key={idx}
              className={`bg-[#F4F3EE] p-6 border-[2px] border-black rounded-[22px] shadow-[4px_4px_0px_0px_#000] ${item.color} flex flex-col justify-between`}
            >
              <div>
                <span className={`inline-block text-white font-black text-[11px] px-3 py-1 rounded-full border-[1px] border-black mb-3 ${item.tagBg} ${item.tagText || 'text-white'}`}>
                  {item.score}
                </span>
                <h3 className="text-lg font-black uppercase text-[#1D2A3A] mb-2 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-gray-600 font-medium text-sm leading-relaxed mb-4">
                  {item.desc}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1D2A3A] pt-3 border-t border-gray-300">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Nội dung đã được chuẩn hóa</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="bg-[#2A8B9D] text-white brutal-card p-8 border-[3px] border-black rounded-[24px] shadow-[6px_6px_0px_0px_#000] flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black uppercase text-white m-0 mb-2">
              Chưa biết bạn ở cấp độ nào?
            </h3>
            <p className="font-medium text-white/90 m-0 text-base">
              Làm bài kiểm tra đánh giá năng lực nhanh trong 5-10 phút để nhận gợi ý bài học cá nhân hóa.
            </p>
          </div>

          <Button
            onClick={() => navigate(isAuthenticated ? '/placement-tests' : '/login')}
            className="brutal-pill border-[2px] border-black font-black uppercase text-black bg-[#FFD700] hover:!bg-[#ffe033] h-12 px-8 text-base shadow-[3px_3px_0px_0px_#000] shrink-0 flex items-center gap-2"
          >
            <span>Kiểm Tra Trình Độ</span>
            <ArrowRight />
          </Button>
        </div>
      </div>
    </section>
  );
};
