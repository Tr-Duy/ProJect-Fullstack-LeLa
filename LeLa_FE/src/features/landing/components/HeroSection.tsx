import { ArrowRight, Compass, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <section className="relative w-full pt-12 md:pt-20 pb-16 bg-[#FDFBF7] border-b-2 border-black">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8">
          
          {/* Left: Text Content */}
          <div className="flex flex-col items-start space-y-6">
            <span className="inline-block bg-[#FDE047] text-black font-black uppercase text-xs px-4 py-1.5 rounded-full border-2 border-black shadow-[3px_3px_0px_#000] tracking-wider mb-4">
              🎯 NỀN TẢNG HỌC TIẾNG ANH TOÀN DIỆN
            </span>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-[#18181B]">
              HỌC TIẾNG ANH<br />
              <span className="text-[#FF5733]">KHÔNG NHÀM CHÁN.</span>
            </h1>
            
            <p className="max-w-[540px] text-base md:text-lg font-medium text-gray-700 leading-relaxed">
              Một nền tảng giúp bạn ghi nhớ từ vựng lâu hơn, luyện tập mỗi ngày và nâng cao trình độ tiếng Anh một cách đơn giản, khoa học cùng Flashcard SRS & AI Tutor.
            </p>

            {/* Feature Check Badges (2 columns x 2 rows) */}
            <div className="grid grid-cols-2 gap-3.5 w-full max-w-[500px]">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 font-bold text-xs md:text-sm text-[#18181B]">
                  <div className="w-5 h-5 rounded-full bg-green-500 border border-black flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[3]" />
                  </div>
                  <span>{b}</span>
                </div>
              ))}
            </div>
            
            {/* CTA Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button 
                type="button"
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                className="bg-white text-black font-bold px-6 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 cursor-pointer text-base md:text-lg"
              >
                <span>Bắt Đầu Học Miễn Phí</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button 
                type="button"
                onClick={() => navigate('/decks')}
                className="bg-white text-black font-bold px-6 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 cursor-pointer text-base md:text-lg"
              >
                <Compass className="w-5 h-5" />
                <span>Khám Phá Bộ Thẻ</span>
              </button>
            </div>
          </div>

          {/* Right: Visual Asset */}
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative w-full max-w-[560px] mx-auto lg:ml-auto"
          >
            <div className="aspect-[4/3] w-full overflow-hidden border-2 border-black shadow-[6px_6px_0px_0px_#000] rounded-2xl bg-white relative group">
              <img 
                src="/images/hero_youth_learning.png" 
                alt="Sinh viên học ngoại ngữ với flashcard" 
                width="560"
                height="420"
                fetchPriority="high"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[#0D9488]/10 mix-blend-multiply" />
            </div>
            
            {/* Mascot float (The Fox) */}
            <motion.div 
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
              className="absolute -top-10 -right-8 w-28 h-28 z-20 flex items-center justify-center drop-shadow-xl"
            >
              <img src="/images/lela_fox_logo.png" alt="LeLa Fox Mascot" width="112" height="112" className="w-full h-full object-contain" />
            </motion.div>

            {/* Decorative Floating Pill */}
            <div className="absolute -bottom-6 -left-4 bg-[#FDE047] px-4 py-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] z-20 flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <span className="font-black text-xs uppercase block text-[#18181B]">Thuật toán SRS</span>
                <span className="text-[11px] font-bold text-gray-800">Ghi nhớ dài hạn 85%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
export default HeroSection;
