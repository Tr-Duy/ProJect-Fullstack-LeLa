import { useNavigate, Link } from 'react-router-dom';
import { HeroSection } from '../components/HeroSection';
import { LearningFlow } from '../components/LearningFlow';
import { FeatureSection } from '../components/FeatureSection';
import { FlashcardDemo } from '../components/FlashcardDemo';
import { AiTutorSpotlight } from '../components/AiTutorSpotlight';
import { LevelSection } from '../components/LevelSection';
import { DailyLearningSection } from '../components/DailyLearningSection';
import { FinalCTA } from '../components/FinalCTA';
import { LandingFooter } from '../components/LandingFooter';
import { BackgroundPattern } from '../components/BackgroundPattern';
import { useAuth } from '../../../shared/providers/AuthProvider';

import bubblePopSound from '../../../assets/sounds/bubble-pop.mp3';

export function LandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, hasRole } = useAuth();

  const playSound = () => {
    const audio = new Audio(bubblePopSound);
    audio.play().catch(() => {
      // Audio autoplay/playback might be blocked or deferred by browser policy without user gesture
    });
  };

  const handleNav = (path: string) => {
    playSound();
    if (path.startsWith('#')) {
      document.querySelector(path)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(path);
    }
  };

  const isAdminUser = hasRole(['ADMIN', 'CONTENT_CREATOR', 'MODERATOR']);

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] relative font-sans text-[#18181B]">
      <BackgroundPattern />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full bg-[#FDFBF7]/95 backdrop-blur border-b-2 border-black">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNav('/')}>
            <div className="w-11 h-11 flex items-center justify-center">
              <img
                src="/images/lela_fox_logo.png"
                alt="LeLa Fox Logo"
                width="44"
                height="44"
                className="w-full h-full object-contain drop-shadow"
              />
            </div>
            <span className="text-2xl font-black text-[#FF5733] tracking-tight ml-1">LeLa</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-bold text-[#18181B]">
            <Link to="/decks" className="hover:text-[#FF5733] transition-colors">
              Khám Phá Bộ Thẻ
            </Link>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                handleNav('#features');
              }}
              className="hover:text-[#FF5733] transition-colors"
            >
              Tính Năng
            </a>
            <Link to="/pricing" className="hover:text-[#FF5733] transition-colors">
              Gói Dịch Vụ
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isAdminUser && (
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="hidden md:inline-flex items-center gap-1 font-bold bg-[#FDE047] hover:bg-[#ffe033] text-black border-2 border-black px-4 py-1.5 rounded-full text-sm shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
              >
                Trang Admin ➔
              </button>
            )}

            {isAuthenticated && user ? (
              <button
                type="button"
                onClick={() => navigate(isAdminUser ? '/admin/dashboard' : '/dashboard')}
                className="font-bold border border-black px-4 py-1.5 rounded-full text-sm bg-white text-[#18181B] hover:bg-gray-100 shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                Hi, {user.username}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('/login')}
                  className="hidden md:inline-flex font-semibold border border-black px-4 py-1.5 rounded-full text-sm text-[#18181B] bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('/register')}
                  className="font-black border-2 border-black bg-[#FF5733] hover:bg-[#ea4a27] text-white px-5 py-2 rounded-full text-sm shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                >
                  Đăng Ký
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="relative z-10 flex-1">
        <HeroSection />
        <LearningFlow />
        <div id="demo">
          <FlashcardDemo playSound={playSound} />
        </div>
        <div id="features">
          <FeatureSection />
        </div>
        <AiTutorSpotlight />
        <LevelSection />
        <DailyLearningSection />
        <FinalCTA />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
export default LandingPage;
