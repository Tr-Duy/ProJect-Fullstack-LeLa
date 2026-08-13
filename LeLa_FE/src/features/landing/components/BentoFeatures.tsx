import { motion, useReducedMotion } from "motion/react";
import { Brain, Clock, CalendarDays, Volume2, Search, Trophy } from "lucide-react";

export function BentoFeatures() {
  const reduce = useReducedMotion();

  const animationProps = {
    initial: reduce ? false : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
  };

  return (
    <section className="w-full py-24 border-y-[3px] border-brand-black relative bg-[#F4F3EE]">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[1.25] text-brand-navy mb-4">
            Được thiết kế để <br />
            <span className="text-brand-coral">nhớ lâu nhất.</span>
          </h2>
          <p className="text-lg font-bold text-brand-navy/80">
            Học ít thời gian hơn nhưng mang lại hiệu quả cao hơn. Chúng tôi tập trung vào 
            những công cụ thực sự giúp não bộ ghi nhớ sâu sắc.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          
          {/* Row 1, Block 1: SRS (Large 2-cols) */}
          <motion.div 
            {...animationProps}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 lg:col-span-2 brutal-card overflow-hidden flex flex-col md:flex-row bg-white hover:-translate-y-2 group"
          >
            <div className="p-8 flex-1 flex flex-col justify-center">
              <div className="w-16 h-16 bg-brand-teal brutal-border border-[3px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tight text-brand-navy mb-3">
                Thuật toán SRS
              </h3>
              <p className="text-brand-navy/80 font-bold text-lg leading-snug">
                Lặp lại ngắt quãng tự động tính toán thời điểm hoàn hảo nhất để nhắc bạn ôn tập, 
                ngay trước khi bạn chuẩn bị quên.
              </p>
            </div>
            <div className="flex-1 bg-brand-teal/10 p-6 flex items-center justify-center border-t-[3px] md:border-t-0 md:border-l-[3px] border-brand-black">
              <div className="w-full aspect-square md:aspect-auto md:h-full max-h-[280px] bg-white brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl flex items-center justify-center p-4">
                {/* Abstract SRS Chart Graphic */}
                <div className="flex items-end gap-2 w-full h-full p-4">
                  <div className="w-1/4 bg-[#1D2A3A] h-[20%]"></div>
                  <div className="w-1/4 bg-[#1D2A3A] h-[50%]"></div>
                  <div className="w-1/4 bg-[#1D2A3A] h-[30%]"></div>
                  <div className="w-1/4 bg-[#F05A4A] h-[90%]"></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Row 1, Block 2: Audio (1-col) */}
          <motion.div 
            {...animationProps}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="brutal-card p-8 bg-[#FFE885] flex flex-col justify-between hover:-translate-y-2 group"
          >
            <div>
              <div className="w-16 h-16 bg-white brutal-border border-[3px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Volume2 className="w-8 h-8 text-brand-navy" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-brand-navy mb-3">
                Phát Âm Chuẩn
              </h3>
              <p className="text-brand-navy/80 font-bold leading-snug">
                Tích hợp Web Speech API giúp bạn nghe cách phát âm chính xác của mọi từ vựng ở nhiều ngôn ngữ khác nhau.
              </p>
            </div>
          </motion.div>

          {/* Row 1, Block 3: Gamification/Streak (1-col) */}
          <motion.div 
            {...animationProps}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="brutal-card p-8 bg-brand-coral flex flex-col justify-between hover:-translate-y-2 group"
          >
            <div>
              <div className="w-16 h-16 bg-white brutal-border border-[3px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-8 h-8 text-brand-navy" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-3">
                Chuỗi Ngày Học
              </h3>
              <p className="text-white/90 font-bold leading-snug">
                Duy trì Streak (chuỗi ngày học liên tục) để giữ lửa đam mê và không bao giờ bỏ cuộc.
              </p>
            </div>
            <div className="mt-8 flex justify-end">
              <span className="text-5xl">🔥</span>
            </div>
          </motion.div>

          {/* Row 2, Block 1: Quizzes (1-col) */}
          <motion.div 
            {...animationProps}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="brutal-card p-8 bg-brand-navy flex flex-col justify-between hover:-translate-y-2 group"
          >
            <div>
              <div className="w-16 h-16 bg-white brutal-border border-[3px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-brand-navy" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-3">
                Bài Thi Tính Giờ
              </h3>
              <p className="text-[#F4F3EE]/80 font-bold leading-snug">
                Thử thách bản thân với các bài trắc nghiệm nhanh, tự động chấm điểm để đánh giá năng lực.
              </p>
            </div>
          </motion.div>

          {/* Row 2, Block 2: Leaderboard (1-col) */}
          <motion.div 
            {...animationProps}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="brutal-card p-8 bg-white flex flex-col justify-between hover:-translate-y-2 group"
          >
            <div>
              <div className="w-16 h-16 bg-brand-teal brutal-border border-[3px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Trophy className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-brand-navy mb-3">
                Bảng Xếp Hạng
              </h3>
              <p className="text-brand-navy/80 font-bold leading-snug">
                Thi đua với bạn bè và cộng đồng thông qua hệ thống xếp hạng điểm XP hàng tuần.
              </p>
            </div>
          </motion.div>

          {/* Row 2, Block 3: Marketplace/Explore (Large 2-cols) */}
          <motion.div 
            {...animationProps}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="md:col-span-2 lg:col-span-2 brutal-card overflow-hidden flex flex-col md:flex-row bg-[#2A8B9D] hover:-translate-y-2 group"
          >
            <div className="flex-1 bg-[#1D2A3A] p-6 flex items-center justify-center border-b-[3px] md:border-b-0 md:border-r-[3px] border-brand-black overflow-hidden relative">
               {/* Abstract Deck Graphic */}
               <div className="relative w-[200px] h-[260px]">
                 <div className="absolute top-4 left-4 w-full h-full bg-white brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl rotate-6"></div>
                 <div className="absolute top-2 left-2 w-full h-full bg-[#F4F3EE] brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl rotate-3"></div>
                 <div className="absolute top-0 left-0 w-full h-full bg-[#FFE885] brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-6 flex flex-col justify-between hover:rotate-0 transition-transform duration-300">
                    <div className="w-12 h-12 bg-white brutal-border rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-brand-navy w-3/4"></div>
                      <div className="h-4 bg-brand-navy w-1/2"></div>
                    </div>
                 </div>
               </div>
            </div>
            <div className="p-8 flex-1 flex flex-col justify-center">
              <div className="w-16 h-16 bg-white brutal-border border-[3px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-8 h-8 text-brand-navy" strokeWidth={2.5} />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tight text-white mb-3">
                Thư Viện Khổng Lồ
              </h3>
              <p className="text-[#F4F3EE]/90 font-bold text-lg leading-snug">
                Khám phá hàng ngàn bộ thẻ công khai từ cộng đồng. Tìm kiếm bất kỳ chủ đề nào bạn muốn học, hoặc chia sẻ bộ thẻ của riêng bạn.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
