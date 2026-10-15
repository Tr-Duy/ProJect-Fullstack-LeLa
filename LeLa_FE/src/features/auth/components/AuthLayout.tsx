import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { motion, useReducedMotion } from 'framer-motion';
import { VocabShowcase } from './VocabShowcase';
import { Lela, type LelaMood } from '../../../shared/components/ui/Lela';

interface AuthLayoutProps {
  children: React.ReactNode;
  lelaMood?: LelaMood;
  lelaPupilOffset?: number;
  backTo?: string;
  backText?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  lelaMood = 'idle',
  lelaPupilOffset = 0,
  backTo = '/',
  backText = 'Trang chủ',
}) => {
  const reduce = useReducedMotion();

  return (
    <div className="w-full min-h-dvh lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-[52%_48%] bg-[var(--bg)] font-sans">
      {/* =========================================================================
          LEFT COLUMN (Desktop >= 1024px): 52% Brand-50 Showcase
          ========================================================================= */}
      <motion.div
        initial={reduce ? false : { opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-col justify-between p-8 xl:p-12 bg-[var(--brand-50)] border-r border-[var(--border)] relative overflow-hidden select-none"
      >
        {/* Subtle dot pattern background */}
        <div className="absolute inset-0 dot-pattern-brand opacity-40 pointer-events-none" />

        {/* Top: Logo LELA. */}
        <div className="relative z-10">
          <Link
            to="/"
            className="font-display font-bold text-3xl tracking-tight text-[var(--brand-700)] flex items-center hover:opacity-90 transition-opacity"
          >
            LELA<span className="text-[var(--sun)]">.</span>
          </Link>
        </div>

        {/* Middle: Headline & VocabShowcase with Lela Mascot */}
        <div className="relative z-10 my-auto py-4 space-y-6">
          <h1 className="font-display font-bold text-[clamp(2.25rem,3.5vw,3.25rem)] text-[var(--text)] tracking-tight leading-[1.15]">
            Mỗi ngày vài từ,{' '}
            <span className="relative inline-block">
              <span>nhớ thật lâu</span>
              <span
                className="absolute left-0 bottom-1 w-full h-3 bg-[var(--sun)]/40 -z-10 rounded-sm"
                aria-hidden="true"
              />
            </span>
            .
          </h1>

          <VocabShowcase lelaMood={lelaMood} lelaPupilOffset={lelaPupilOffset} />
        </div>

        {/* Bottom subtle copyright / motto */}
        <div className="relative z-10 text-xs text-[var(--text-3)]">
          <span>© {new Date().getFullYear()} LeLa — Học từ vựng TOEIC thông minh với SM-2 & AI.</span>
        </div>
      </motion.div>

      {/* =========================================================================
          RIGHT COLUMN: Form container (Centered, Max 420px, Warm Shadow)
          ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 lg:p-10 lg:overflow-y-auto relative min-h-dvh lg:min-h-0 bg-[var(--bg)]">
        {/* Top bar on right column: Mobile branding + Desktop Back Link */}
        <div className="w-full flex items-center justify-between lg:justify-end pb-4">
          {/* Mobile Top Banner with Mini Lela */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/"
              className="font-display font-bold text-2xl tracking-tight text-[var(--brand-700)] flex items-center"
            >
              LELA<span className="text-[var(--sun)]">.</span>
            </Link>
            <span className="text-xs text-[var(--text-2)] font-medium hidden sm:inline">
              — Mỗi ngày vài từ, nhớ thật lâu.
            </span>
          </div>

          {/* Clean small back link in top-right */}
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-700)] hover:text-[var(--brand-600)] transition-colors p-2 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer"
          >
            <ArrowLeftOutlined className="text-xs" />
            <span>{backText}</span>
          </Link>
        </div>

        {/* Mobile Mini Lela greeting bar */}
        <div className="lg:hidden flex items-center gap-3 p-3 mb-4 rounded-[16px] bg-[var(--brand-50)] border border-[var(--border)]">
          <Lela mood={lelaMood} size={48} pupilOffset={lelaPupilOffset} />
          <div className="text-xs">
            <span className="font-display font-bold text-[var(--text)] block">Mỗi ngày vài từ, nhớ thật lâu!</span>
            <span className="text-[var(--text-2)] text-[11px]">Học từ vựng SM-2 và luyện nói AI chuẩn TOEIC</span>
          </div>
        </div>

        {/* Main Centered Form Card (Max 420px, White, Radius 24px, Padding 40px) */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="my-auto w-full max-w-[420px] mx-auto bg-white rounded-[24px] border border-[var(--border)] shadow-[var(--shadow-md)] p-6 sm:p-10"
        >
          {children}
        </motion.div>

        {/* Footer info for mobile */}
        <div className="text-center pt-6 text-xs text-[var(--text-3)] lg:invisible">
          <span>© {new Date().getFullYear()} LeLa Learning</span>
        </div>
      </div>
    </div>
  );
};
