import { useNavigate, Link } from 'react-router-dom';
import { Button } from 'antd';
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
    audio.play().catch((e) => console.error('Audio play failed', e));
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
    <div className="flex flex-col min-h-screen bg-[#F4F3EE] relative font-sans text-[#1D2A3A]">
      <BackgroundPattern />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full bg-[#F4F3EE]/95 backdrop-blur border-b-[3px] border-black">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNav('/')}>
            <div className="w-11 h-11 flex items-center justify-center">
              <img
                src="/images/lela_fox_logo.png"
                alt="LeLa Fox Logo"
                className="w-full h-full object-contain drop-shadow"
              />
            </div>
            <span className="text-2xl font-black text-[#1D2A3A] tracking-tight ml-1">LeLa</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-bold text-[#1D2A3A]">
            <Link to="/decks" className="hover:text-[#F05A4A] transition-colors">
              Khám Phá Bộ Thẻ
            </Link>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                handleNav('#features');
              }}
              className="hover:text-[#F05A4A] transition-colors"
            >
              Tính Năng
            </a>
            <Link to="/pricing" className="hover:text-[#F05A4A] transition-colors">
              Gói Dịch Vụ
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isAdminUser && (
              <Button
                onClick={() => navigate('/admin/dashboard')}
                className="hidden md:inline-flex font-bold brutal-pill bg-[#FFD700] hover:bg-[#ffe033] text-black border-[2px] border-black text-sm"
              >
                Trang Admin ➔
              </Button>
            )}

            {isAuthenticated && user ? (
              <Button
                onClick={() => navigate(isAdminUser ? '/admin/dashboard' : '/dashboard')}
                className="font-bold brutal-pill border-[2px] border-black bg-white text-[#1D2A3A] hover:bg-gray-100"
              >
                Hi, {user.username}
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => handleNav('/login')}
                  className="hidden md:inline-flex font-bold brutal-pill border-[2px] border-black bg-white text-[#1D2A3A] hover:bg-gray-100"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => handleNav('/register')}
                  className="font-black brutal-pill border-[2px] border-black bg-[#F05A4A] hover:!bg-[#d94f41] text-white shadow-[2px_2px_0px_0px_#000]"
                >
                  Đăng Ký
                </Button>
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
