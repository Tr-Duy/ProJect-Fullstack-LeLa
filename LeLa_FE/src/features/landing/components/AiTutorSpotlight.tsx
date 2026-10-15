import React from 'react';
import { Bot, Sparkles, MessageSquare, SpellCheck, ArrowRight } from 'lucide-react';
import { TranslationOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export const AiTutorSpotlight: React.FC = () => {
  const navigate = useNavigate();

  const capabilities = [
    { icon: <TranslationOutlined className="text-xl text-[#0D9488]" />, label: 'Dịch thuật Anh ↔ Việt tự nhiên, không rào cản' },
    { icon: <SpellCheck className="text-xl text-[#FF5733]" />, label: 'Sửa lỗi ngữ pháp & nâng cấp câu tiếng Anh' },
    { icon: <Bot className="text-xl text-[#A855F7]" />, label: 'Giải thích nghĩa từ, từ đồng nghĩa & ví dụ thực tế' },
    { icon: <MessageSquare className="text-xl text-[#EA580C]" />, label: 'Luyện hội thoại đóng vai theo tình huống thực tế' },
  ];

  return (
    <section className="w-full py-20 bg-[#FDFBF7] border-b-2 border-black overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_0px_#000] p-8 md:p-12 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left Content */}
            <div className="flex flex-col items-start gap-6">
              <span className="inline-flex items-center gap-2 bg-[#A855F7] text-white font-black uppercase text-xs px-4 py-1.5 rounded-full border-2 border-black shadow-[3px_3px_0px_#000]">
                <Sparkles className="w-4 h-4" /> TRỢ LÝ THÔNG MINH
              </span>

              <h2 className="text-3xl md:text-5xl font-black uppercase text-[#18181B] tracking-tight leading-tight">
                AI Tutor – Bạn Đồng Hành Học Tiếng Anh 24/7
              </h2>

              <p className="text-base md:text-lg font-medium text-gray-700 leading-relaxed">
                Không lo ngại hỏi sai hay hỏi lại nhiều lần. AI Tutor giúp bạn tra từ, sửa câu, học ngữ pháp và luyện phản xạ hội thoại bất cứ lúc nào.
              </p>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                {capabilities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-[#FDFBF7] rounded-xl border border-black">
                    {item.icon}
                    <span className="font-bold text-xs text-[#18181B] leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/ai-chat')}
                  className="bg-[#A855F7] hover:bg-[#9333ea] text-white font-bold border-2 border-black shadow-[3px_3px_0px_#000] rounded-xl px-6 py-3 text-base flex items-center gap-2 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                >
                  <span>Thử AI Tutor Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Interactive Mock View */}
            <div className="bg-[#18181B] border-2 border-black rounded-2xl p-6 text-white shadow-[6px_6px_0px_0px_#000] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#A855F7] border border-white flex items-center justify-center font-black">
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
                <div className="bg-white/10 p-3 rounded-xl border border-white/20 max-w-[85%]">
                  <span className="text-gray-300 font-semibold block mb-1">Người học:</span>
                  <span>"How to improve my English speaking skills fast?"</span>
                </div>

                <div className="bg-[#0D9488] p-3.5 rounded-xl border border-black text-white max-w-[90%] ml-auto shadow-[2px_2px_0px_0px_#000]">
                  <span className="font-bold block mb-1 text-[#FDE047]">🤖 AI Tutor:</span>
                  <span>Để cải thiện kỹ năng nói nhanh nhất: 1. Học từ vựng theo cụm thay vì từ đơn lẻ. 2. Luyện tập phản xạ hằng ngày với Flashcard LeLa. 3. Nói chuyện cùng mình tại đây mỗi ngày!</span>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-3 flex gap-2">
                <div className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-gray-400 text-xs">
                  Nhập câu hỏi tiếng Anh hoặc chọn hành động...
                </div>
                <button
                  type="button"
                  className="bg-[#FDE047] text-black font-black border border-black rounded-xl px-4 py-1.5 text-xs hover:bg-[#ffe033] shadow-[1px_1px_0px_#000] cursor-pointer"
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default AiTutorSpotlight;
