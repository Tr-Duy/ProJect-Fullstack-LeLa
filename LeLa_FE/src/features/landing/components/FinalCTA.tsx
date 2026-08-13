import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { useAuth } from '../../../shared/providers/AuthProvider';

export const FinalCTA: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <section className="w-full py-24 bg-[#1D2A3A] text-white border-b-[3px] border-black relative overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 text-center relative z-10">
        <span className="inline-block bg-[#F05A4A] text-white font-black uppercase text-xs px-4 py-1.5 rounded-full border-[2px] border-black shadow-[2px_2px_0px_0px_#000] mb-6">
          BẮT ĐẦU NGAY HÔM NAY
        </span>

        <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight text-white mb-6 leading-tight max-w-4xl mx-auto">
          Sẵn Sàng Chinh Phục Tiếng Anh Cùng LeLa?
        </h2>

        <p className="text-lg md:text-xl font-medium text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Đăng ký miễn phí trong vài giây và trải nghiệm phương pháp học từ vựng hiệu quả hơn mỗi ngày.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
            className="brutal-pill border-[2px] border-black font-black uppercase text-white bg-[#F05A4A] hover:!bg-[#d94f41] h-14 px-10 text-lg shadow-[4px_4px_0px_0px_#000] flex items-center gap-2"
          >
            <span>Bắt Đầu Học Miễn Phí</span>
            <ArrowRight className="w-5 h-5" />
          </Button>

          <Button
            onClick={() => navigate('/decks')}
            className="brutal-pill border-[2px] border-black font-black uppercase text-black bg-[#FFD700] hover:!bg-[#ffe033] h-14 px-8 text-lg shadow-[4px_4px_0px_0px_#000] flex items-center gap-2"
          >
            <Compass className="w-5 h-5" />
            <span>Khám Phá Bộ Thẻ</span>
          </Button>
        </div>
      </div>
    </section>
  );
};
