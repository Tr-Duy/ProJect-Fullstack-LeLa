import React from 'react';
import { Button } from 'antd';
import { Bot, Sparkles, MessageSquare, SpellCheck, ArrowRight } from 'lucide-react';
import { TranslationOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export const AiTutorSpotlight: React.FC = () => {
  const navigate = useNavigate();

  const capabilities = [
    { icon: <TranslationOutlined className="text-xl text-[#2A8B9D]" />, label: 'Dịch thuật Anh ↔ Việt tự nhiên, không rào cản' },
    { icon: <SpellCheck className="text-xl text-[#F05A4A]" />, label: 'Sửa lỗi ngữ pháp & nâng cấp câu tiếng Anh' },
    { icon: <Bot className="text-xl text-[#9B51E0]" />, label: 'Giải thích nghĩa từ, từ đồng nghĩa & ví dụ thực tế' },
    { icon: <MessageSquare className="text-xl text-[#FF9900]" />, label: 'Luyện hội thoại đóng vai theo tình huống thực tế' },
  ];

  return (
    <section className="w-full py-20 bg-[#F4F3EE] border-b-[3px] border-black overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="bg-white border-[3px] border-black rounded-[28px] shadow-[8px_8px_0px_0px_#000] p-8 md:p-12 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left Content */}
            <div className="flex flex-col items-start gap-6">
              <span className="inline-flex items-center gap-2 bg-[#9B51E0] text-white font-black uppercase text-xs px-4 py-1.5 rounded-full border-[2px] border-black shadow-[2px_2px_0px_0px_#000]">
                <Sparkles className="w-4 h-4" /> TRỢ LÝ THÔNG MINH
              </span>

              <h2 className="text-3xl md:text-5xl font-black uppercase text-[#1D2A3A] tracking-tight leading-tight">
                AI Tutor – Bạn Đồng Hành Học Tiếng Anh 24/7
              </h2>

              <p className="text-base md:text-lg font-medium text-gray-700 leading-relaxed">
                Không lo ngại hỏi sai hay hỏi lại nhiều lần. AI Tutor giúp bạn tra từ, sửa câu, học ngữ pháp và luyện phản xạ hội thoại bất cứ lúc nào.
              </p>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                {capabilities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-[#F4F3EE] rounded-xl border-[2px] border-black">
                    {item.icon}
                    <span className="font-bold text-xs text-[#1D2A3A] leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex flex-wrap gap-4">
                <Button
                  onClick={() => navigate('/ai-chat')}
                  className="brutal-pill border-[2px] border-black font-black uppercase text-white bg-[#9B51E0] hover:!bg-[#823bc8] h-12 px-8 text-base shadow-[3px_3px_0px_0px_#000] flex items-center gap-2"
                >
                  <span>Thử AI Tutor Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Right Interactive Mock View */}
            <div className="bg-[#1D2A3A] border-[3px] border-black rounded-[22px] p-6 text-white shadow-[6px_6px_0px_0px_#000] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#9B51E0] border-[2px] border-white flex items-center justify-center font-black">
                    🤖
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm uppercase m-0">LeLa AI Tutor</h4>
                    <span className="text-[10px] text-green-400 font-bold">● Trực tuyến 24/7</span>
                  </div>
                </div>
                <span className="text-xs bg-white/10 px-3 py-1 rounded-full border border-white/20 font-mono">EN ↔ VI</span>
              </div>

              {/* Chat Bubble Demo */}
              <div className="space-y-3 font-sans text-xs md:text-sm">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/20 max-w-[85%]">
                  <span className="text-gray-300 font-semibold block mb-1">Người học:</span>
                  <span>"How to improve my English speaking skills fast?"</span>
                </div>

                <div className="bg-[#2A8B9D] p-3 rounded-2xl border-[2px] border-black text-white max-w-[90%] ml-auto shadow-[2px_2px_0px_0px_#000]">
                  <span className="font-bold block mb-1 text-yellow-300">🤖 AI Tutor:</span>
                  <span>Để cải thiện kỹ năng nói nhanh nhất: 1. Học từ vựng theo cụm thay vì từ đơn lẻ. 2. Luyện tập phản xạ hằng ngày với Flashcard LeLa. 3. Nói chuyện cùng mình tại đây mỗi ngày!</span>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-3 flex gap-2">
                <div className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-gray-400 text-xs">
                  Nhập câu hỏi tiếng Anh hoặc chọn hành động...
                </div>
                <Button className="bg-[#FFD700] text-black font-black border-[2px] border-black rounded-xl h-auto px-4 text-xs">
                  Gửi
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
