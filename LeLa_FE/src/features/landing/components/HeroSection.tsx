import { Button } from 'antd';
import { ArrowRight, Compass, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/providers/AuthProvider';

export function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const benefits = [
    'Học theo trình độ',
    'Flashcard thông minh',
    'AI Tutor hỗ trợ',
    'Theo dõi tiến bộ',
  ];

  return (
    <section className="relative w-full pt-12 md:pt-20 pb-16 bg-[#F4F3EE] border-b-[3px] border-black">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8">
          
          {/* Left: Text Content */}
          <div className="flex flex-col items-start space-y-6">
            <span className="inline-flex items-center gap-2 bg-[#FFD700] text-black font-black uppercase text-xs px-4 py-1.5 rounded-full border-[2px] border-black shadow-[2px_2px_0px_0px_#000]">
              🎯 NỀN TẢNG HỌC TIẾNG ANH TOÀN DIỆN
            </span>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-[#1D2A3A]">
              HỌC TIẾNG ANH<br />
              <span className="text-[#F05A4A]">KHÔNG NHÀM CHÁN.</span>
            </h1>
            
            <p className="max-w-[540px] text-base md:text-lg font-medium text-gray-700 leading-relaxed">
              Một nền tảng giúp bạn ghi nhớ từ vựng lâu hơn, luyện tập mỗi ngày và nâng cao trình độ tiếng Anh một cách đơn giản, khoa học cùng Flashcard SRS & AI Tutor.
            </p>

            {/* Feature Check Badges */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-[500px]">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2 font-bold text-xs md:text-sm text-[#1D2A3A]">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
            
            {/* CTA Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Button 
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                className="h-14 px-8 text-base md:text-lg font-black brutal-pill bg-[#F05A4A] hover:!bg-[#d94f41] text-white border-[2px] border-black shadow-[4px_4px_0px_0px_#000] flex items-center gap-2"
              >
                <span>Bắt Đầu Học Miễn Phí</span>
                <ArrowRight className="w-5 h-5" />
              </Button>

              <Button 
                onClick={() => navigate('/decks')}
                className="h-14 px-7 text-base md:text-lg font-black brutal-pill bg-white text-[#1D2A3A] hover:bg-gray-100 border-[2px] border-black shadow-[4px_4px_0px_0px_#000] flex items-center gap-2"
              >
                <Compass className="w-5 h-5" />
                <span>Khám Phá Bộ Thẻ</span>
              </Button>
            </div>
          </div>

          {/* Right: Visual Asset */}
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative w-full max-w-[560px] mx-auto lg:ml-auto"
          >
            <div className="aspect-[4/3] w-full overflow-hidden border-[3px] border-black shadow-[8px_8px_0px_0px_#000] rounded-[24px] bg-[#2A8B9D] relative group">
              <img 
                src="/images/hero_youth_learning.png" 
                alt="Sinh viên học ngoại ngữ với flashcard" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[#2A8B9D]/10 mix-blend-multiply" />
            </div>
            
            {/* Mascot float (The Fox) */}
            <motion.div 
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
              className="absolute -top-10 -right-8 w-28 h-28 z-20 flex items-center justify-center drop-shadow-xl"
            >
              <img src="/images/lela_fox_logo.png" alt="LeLa Fox Mascot" className="w-full h-full object-contain" />
            </motion.div>

            {/* Decorative Floating Pill */}
            <div className="absolute -bottom-6 -left-4 bg-[#FFD700] px-5 py-3 rounded-2xl border-[2px] border-black shadow-[3px_3px_0px_0px_#000] z-20 flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <span className="font-black text-xs uppercase block text-[#1D2A3A]">Thuật toán SRS</span>
                <span className="text-[11px] font-bold text-gray-700">Ghi nhớ dài hạn 95%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
