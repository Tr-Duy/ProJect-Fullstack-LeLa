import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOutlined, LockOutlined } from '@ant-design/icons';
import { Pressable } from '../../../ui/motion/Pressable';
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
  const neededCards = (voiceStatus?.requiredCardsCount ?? 20) - (voiceStatus?.learnedCardsCount ?? 0);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-bold text-xl text-[var(--text)] tracking-tight">
          Phòng luyện kỹ năng
        </h3>
        <p className="text-xs text-[var(--text-3)] mt-0.5">
          Áp dụng từ vựng vào ngữ cảnh thực chiến và luyện phản xạ tự nhiên
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Luyện gõ từ vựng */}
        <Pressable
          onClick={() => navigate('/typing-game')}
          className="bg-[var(--surface)] rounded-[20px] p-5 border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] flex flex-col justify-between cursor-pointer group"
        >
          <div>
            {/* Custom Keyboard SVG Illustration */}
            <div className="w-12 h-12 rounded-[14px] bg-[var(--brand-50)] border border-[var(--brand-100)] flex items-center justify-center mb-4 group-hover:scale-105 group-hover:-rotate-3 transition-transform">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--brand-700)]">
                <rect width="20" height="16" x="2" y="4" rx="3" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" />
              </svg>
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
            <span className="text-xs font-semibold text-[var(--brand-700)] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
              Vào phòng <ArrowRightOutlined className="text-[10px]" />
            </span>
          </div>
        </Pressable>

        {/* Card 2: Hội thoại AI (TEAL TONE) */}
        <Pressable
          onClick={() => navigate('/voice-conversation')}
          className="bg-[var(--surface)] rounded-[20px] p-5 border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] flex flex-col justify-between cursor-pointer group relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              {/* Custom AI Voice Speech Bubble SVG */}
              <div className="w-12 h-12 rounded-[14px] bg-[var(--teal-50)] border border-[var(--teal)]/20 flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-transform">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--teal)]">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--teal-50)] text-[var(--teal)]">
                AI Voice
              </span>
            </div>

            <h4 className="font-display font-bold text-base text-[var(--text)] mb-1">
              Hội thoại AI
            </h4>
            <p className="text-xs text-[var(--text-2)] leading-relaxed mb-2">
              Luyện nói nhập vai tình huống TOEIC. Chấm chuẩn phát âm IPA và phản hồi ngữ pháp thời gian thực.
            </p>

            {/* Quota or Lock explanation: strictly from API, hidden if no data */}
            {!isVoiceUnlocked ? (
              <div className="text-[11px] text-[var(--danger)] flex items-center gap-1 font-medium bg-[var(--danger-50)] p-2 rounded-[10px] my-2">
                <LockOutlined className="text-xs" />
                <span>Cần ôn thêm {Math.max(1, neededCards)} thẻ để mở khóa</span>
              </div>
            ) : voiceStatus ? (
              isFreeUser ? (
                <div className="text-[11px] text-[var(--text-3)] bg-[var(--surface-2)] p-2 rounded-[10px] my-2">
                  <span>Dùng thử {remainingVoiceQuota}/{voiceStatus.maxSessionsPerDay} buổi hôm nay</span>
                  <span
                    className="block text-[var(--brand-700)] font-semibold mt-0.5 cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/pricing');
                    }}
                  >
                    Nâng cấp PRO để mở không giới hạn →
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-[var(--success)] font-medium bg-[var(--success-50)] p-1.5 rounded-[8px] my-2 inline-block">
                  Còn {remainingVoiceQuota} lượt hôm nay
                </div>
              )
            ) : null}
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--teal)]">
              Phản xạ nói 1-1
            </span>
            <span className="text-xs font-semibold text-[var(--teal)] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
              Luyện ngay <ArrowRightOutlined className="text-[10px]" />
            </span>
          </div>
        </Pressable>

        {/* Card 3: AI Tutor (TEAL TONE) */}
        <Pressable
          onClick={() => navigate('/ai-chat')}
          className="bg-[var(--surface)] rounded-[20px] p-5 border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] flex flex-col justify-between cursor-pointer group"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              {/* Custom Book Tutor SVG */}
              <div className="w-12 h-12 rounded-[14px] bg-[var(--teal-50)] border border-[var(--teal)]/20 flex items-center justify-center group-hover:scale-105 group-hover:-rotate-3 transition-transform">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--teal)]">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10M6 10h10" />
                </svg>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--teal-50)] text-[var(--teal)]">
                AI Tutor
              </span>
            </div>

            <h4 className="font-display font-bold text-base text-[var(--text)] mb-1">
              Trợ lý học tập AI
            </h4>
            <p className="text-xs text-[var(--text-2)] leading-relaxed mb-3">
              Hỏi đáp ngữ pháp, tra nghĩa chuyên sâu, sửa lỗi hành văn câu và mẹo làm bài thi TOEIC.
            </p>

            <div className="bg-[var(--surface-2)] p-2.5 rounded-[12px] text-[11px] text-[var(--text-2)] italic line-clamp-2 border border-[var(--border)]">
              "Phân biệt accommodate và adapt trong Part 5..."
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--text-3)]">
              Hỏi đáp 24/7
            </span>
            <span className="text-xs font-semibold text-[var(--teal)] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
              Hỏi AI <ArrowRightOutlined className="text-[10px]" />
            </span>
          </div>
        </Pressable>
      </div>
    </div>
  );
};

export default SkillsPracticeSection;
