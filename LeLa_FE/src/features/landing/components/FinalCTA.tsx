import React from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/providers/AuthProvider';

export const FinalCTA: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <section className="w-full py-24 bg-[#181E24] text-white border-b-2 border-black relative overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 text-center relative z-10">
        <span className="inline-block bg-[#FF5733] text-white font-black uppercase text-xs px-4 py-1.5 rounded-full border-2 border-black shadow-[3px_3px_0px_#000] mb-6">
          BẮT ĐẦU NGAY HÔM NAY
        </span>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white !text-white tracking-tight uppercase text-center mb-4 leading-tight max-w-4xl mx-auto">
          Sẵn Sàng Chinh Phục <span className="text-amber-400 !text-amber-400">Tiếng Anh Cùng LeLa?</span>
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto text-center mb-8 font-medium leading-relaxed">
          Tạo tài khoản miễn phí chỉ trong 30 giây. Bắt đầu xây dựng lộ trình học từ vựng khoa học và hiệu quả ngay hôm nay.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
            className="bg-white text-black font-black px-8 py-3.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 cursor-pointer text-base md:text-lg"
          >
            <span>Bắt Đầu Học Miễn Phí</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/decks')}
            className="bg-white text-black font-black px-8 py-3.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 cursor-pointer text-base md:text-lg"
          >
            <Compass className="w-5 h-5" />
            <span>Khám Phá Bộ Thẻ</span>
          </button>
        </div>
      </div>
    </section>
  );
};
export default FinalCTA;
