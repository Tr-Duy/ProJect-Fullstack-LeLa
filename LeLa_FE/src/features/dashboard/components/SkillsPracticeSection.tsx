import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EditOutlined, AudioOutlined, RobotOutlined, ArrowRightOutlined, LockOutlined } from '@ant-design/icons';
import type { VoiceStatusResponse } from '../../voice-conversation/api/voice-conversation.api';

interface SkillsPracticeSectionProps {
  voiceStatus?: VoiceStatusResponse | null;
  isFreeUser?: boolean;
}

export const SkillsPracticeSection: React.FC<SkillsPracticeSectionProps> = ({
  voiceStatus,
  isFreeUser = false,
}) => {
  const navigate = useNavigate();

  const isVoiceUnlocked = voiceStatus?.unlocked ?? true;
  const remainingVoiceQuota = voiceStatus?.remainingQuota ?? 0;
  const maxSessions = voiceStatus?.maxSessionsPerDay ?? 3;
  const neededCards = (voiceStatus?.requiredCardsCount ?? 20) - (voiceStatus?.learnedCardsCount ?? 0);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-bold text-xl text-[var(--text)] tracking-tight">
          Luyện kỹ năng phản xạ
        </h3>
        <p className="text-xs text-[var(--text-3)]">
          Áp dụng từ vựng vào ngữ cảnh thực chiến
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Luyện gõ từ vựng */}
        <div
          onClick={() => navigate('/typing-game')}
          className="bg-[var(--surface)] rounded-[20px] p-5 border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
        >
          <div>
            <div className="w-11 h-11 rounded-[14px] bg-[var(--surface-2)] flex items-center justify-center text-[var(--text)] text-xl mb-4 group-hover:scale-105 transition-transform">
              <EditOutlined />
            </div>

            <h4 className="font-display font-bold text-base text-[var(--text)] mb-1">
              Luyện gõ từ vựng
            </h4>
            <p className="text-xs text-[var(--text-2)] leading-relaxed mb-4">
              Nhìn nghĩa đoán từ và rèn phản xạ chính tả với nhịp độ tăng dần cùng chuỗi combo điểm số.
            </p>
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--text-3)]">
              Phản xạ mặt chữ
            </span>
            <span className="text-xs font-semibold text-[var(--brand)] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
              Vào phòng <ArrowRightOutlined className="text-[10px]" />
            </span>
          </div>
        </div>

        {/* Card 2: Hội thoại AI */}
        <div
          onClick={() => navigate('/voice-conversation')}
          className="bg-[var(--surface)] rounded-[20px] p-5 border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-[14px] bg-[var(--brand-50)] flex items-center justify-center text-[var(--brand)] text-xl group-hover:scale-105 transition-transform">
                <AudioOutlined />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)]">
                AI Voice
              </span>
            </div>

            <h4 className="font-display font-bold text-base text-[var(--text)] mb-1">
              Hội thoại AI
            </h4>
            <p className="text-xs text-[var(--text-2)] leading-relaxed mb-2">
              Luyện nói nhập vai tình huống TOEIC. Chấm chuẩn phát âm IPA và phản hồi ngữ pháp thời gian thực.
            </p>

            {/* Quota or Lock explanation */}
            {!isVoiceUnlocked ? (
              <div className="text-[11px] text-[var(--warning)] flex items-center gap-1 font-medium bg-[var(--warning-50)] p-2 rounded-[10px] my-2">
                <LockOutlined className="text-xs" />
                <span>Cần ôn thêm {Math.max(1, neededCards)} thẻ để mở khóa</span>
              </div>
            ) : isFreeUser ? (
              <div className="text-[11px] text-[var(--text-3)] bg-[var(--surface-2)] p-2 rounded-[10px] my-2">
                <span>Dùng thử {remainingVoiceQuota}/{maxSessions} buổi hôm nay</span>
                <span className="block text-[var(--brand)] font-semibold mt-0.5" onClick={(e) => { e.stopPropagation(); navigate('/pricing'); }}>
                  Nâng cấp PRO để mở không giới hạn →
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-[var(--success)] font-medium bg-[var(--success-50)] p-1.5 rounded-[8px] my-2 inline-block">
                Còn {remainingVoiceQuota} lượt hôm nay
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--text-3)]">
              Giao tiếp 1-1
            </span>
            <span className="text-xs font-semibold text-[var(--brand)] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
              Bắt đầu nói <ArrowRightOutlined className="text-[10px]" />
            </span>
          </div>
        </div>

        {/* Card 3: AI Tutor */}
        <div
          onClick={() => navigate('/ai-chat')}
          className="bg-[var(--surface)] rounded-[20px] p-5 border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-[14px] bg-[var(--brand-50)] flex items-center justify-center text-[var(--brand-700)] text-xl group-hover:scale-105 transition-transform">
                <RobotOutlined />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)]">
                24/7
              </span>
            </div>

            <h4 className="font-display font-bold text-base text-[var(--text)] mb-1">
              AI Tutor 24/7
            </h4>
            <p className="text-xs text-[var(--text-2)] leading-relaxed mb-3">
              Gia sư giải thích cặn kẽ ngữ pháp, cụm collocations và đặt câu theo ngữ cảnh bài học.
            </p>

            {/* Sample Question Prompt Chip */}
            <div className="p-2 rounded-[10px] bg-[var(--surface-2)] text-[11px] text-[var(--brand-700)] font-medium line-clamp-1 italic mb-2">
              &ldquo;Cách dùng affect và effect trong TOEIC?&rdquo;
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--text-3)]">
              Hỏi đáp ngữ pháp
            </span>
            <span className="text-xs font-semibold text-[var(--brand)] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
              Trò chuyện <ArrowRightOutlined className="text-[10px]" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
