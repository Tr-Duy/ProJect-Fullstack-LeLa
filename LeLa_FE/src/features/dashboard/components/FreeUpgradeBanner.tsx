import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stamp } from '../../../shared/components/ui/Stamp';
import { CrownFilled, ArrowRightOutlined, CheckOutlined } from '@ant-design/icons';

interface FreeUpgradeBannerProps {
  isFreeUser: boolean;
}

export const FreeUpgradeBanner: React.FC<FreeUpgradeBannerProps> = ({ isFreeUser }) => {
  const navigate = useNavigate();

  if (!isFreeUser) return null;

  return (
    <div className="relative bg-paper-2 rounded-[12px] p-6 sm:p-7 border-2 border-ink shadow-[4px_4px_0_var(--ink)] overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <Stamp text="ĐẶC QUYỀN PRO / VIP" variant="sun" />
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-ink-mute">
              MỞ KHÓA TOÀN DIỆN
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight">
            Nâng cấp để luyện Hội thoại AI không giới hạn
          </h3>

          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
            Tài khoản FREE giới hạn 3 lượt hội thoại/ngày. Nâng cấp PRO để trò chuyện tự do cùng trợ lý bản xứ, chấm chuẩn phát âm IPA, truy cập toàn bộ đề thi TOEIC độc quyền & bộ từ vựng nâng cao.
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-soft font-medium pt-1">
            <span className="flex items-center gap-1">
              <CheckOutlined className="text-mint text-[11px]" /> Không giới hạn Hội thoại AI
            </span>
            <span className="flex items-center gap-1">
              <CheckOutlined className="text-mint text-[11px]" /> AI Tutor giải thích ngữ pháp 24/7
            </span>
            <span className="flex items-center gap-1">
              <CheckOutlined className="text-mint text-[11px]" /> Trọn bộ 10 đề thi Level-Up & Final Test
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center">
          <button
            type="button"
            onClick={() => navigate('/pricing')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[10px] bg-brand text-white font-bold text-sm sm:text-base border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_var(--ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            <CrownFilled className="text-sun" />
            <span>Nâng cấp ngay từ 59k</span>
            <ArrowRightOutlined className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
};
