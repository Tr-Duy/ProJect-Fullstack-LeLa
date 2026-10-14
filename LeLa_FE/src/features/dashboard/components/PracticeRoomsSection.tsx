import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FlashCardBox } from '../../../shared/components/ui/FlashCardBox';
import { Stamp } from '../../../shared/components/ui/Stamp';
import { HighlighterText } from '../../../shared/components/ui/HighlighterText';
import {
  AudioOutlined,
  CommentOutlined,
  FormOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import type { VoiceStatusResponse } from '../../voice-conversation/api/voice-conversation.api';

interface PracticeRoomsSectionProps {
  voiceStatus?: VoiceStatusResponse | null;
}

export const PracticeRoomsSection: React.FC<PracticeRoomsSectionProps> = ({ voiceStatus }) => {
  const navigate = useNavigate();

  const remainingQuotaText = voiceStatus
    ? voiceStatus.unlocked
      ? `Còn ${voiceStatus.remainingQuota}/${voiceStatus.maxSessionsPerDay} lượt hôm nay`
      : 'Cần đạt 20 thẻ REVIEW để mở'
    : '5 lượt mỗi ngày';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight flex items-center gap-2">
          <HighlighterText text="Phòng luyện phản xạ" highlight="Phòng luyện" />
        </h2>
        <span className="text-xs font-mono text-ink-mute uppercase tracking-wider hidden sm:inline">
          3 PHƯƠNG PHÁP CHỦ ĐỘNG
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Typing Game */}
        <FlashCardBox
          interactive
          onClick={() => navigate('/typing-game')}
          className="flex flex-col justify-between bg-card"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-[8px] bg-paper-2 border-2 border-ink flex items-center justify-center text-ink text-lg">
                <FormOutlined />
              </div>
              <Stamp text="PHẢN XẠ PHÍM" variant="neutral" />
            </div>

            <h3 className="text-lg font-bold font-display text-ink mb-1">
              Luyện gõ từ vựng
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Nhìn nghĩa đoán từ, gõ chính xác trong áp lực thời gian để rèn phản xạ chính tả và ghi nhớ mặt chữ.
            </p>
          </div>

          <div className="pt-4 mt-3 border-t border-line flex items-center justify-between">
            <span className="text-[11px] font-mono text-ink-mute">COMBO & TỐC ĐỘ</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-brand">
              Vào phòng <ArrowRightOutlined className="text-[10px]" />
            </span>
          </div>
        </FlashCardBox>

        {/* Card 2: Voice Conversation */}
        <FlashCardBox
          interactive
          onClick={() => navigate('/voice-conversation')}
          className="flex flex-col justify-between bg-card"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-[8px] bg-sun/30 border-2 border-ink flex items-center justify-center text-ink text-lg">
                <AudioOutlined />
              </div>
              <div className="flex items-center gap-1.5">
                <Stamp text="AI" variant="sun" />
                <Stamp text="LIVETALK" variant="brand" />
              </div>
            </div>

            <h3 className="text-lg font-bold font-display text-ink mb-1">
              Hội thoại AI
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Luyện nói nhập vai tình huống TOEIC. Chấm điểm phát âm, ngữ pháp, độ trôi chảy và vốn từ theo thời gian thực.
            </p>
          </div>

          <div className="pt-4 mt-3 border-t border-line flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-ink-soft tabular-nums">
              {remainingQuotaText}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-brand">
              Bắt đầu nói <ArrowRightOutlined className="text-[10px]" />
            </span>
          </div>
        </FlashCardBox>

        {/* Card 3: AI Tutor */}
        <FlashCardBox
          interactive
          onClick={() => navigate('/ai-chat')}
          className="flex flex-col justify-between bg-card"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-[8px] bg-brand/15 border-2 border-ink flex items-center justify-center text-brand text-lg">
                <CommentOutlined />
              </div>
              <Stamp text="AI TUTOR" variant="brand" />
            </div>

            <h3 className="text-lg font-bold font-display text-ink mb-1">
              AI Tutor 24/7
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Gia sư cá nhân hóa giải thích cặn kẽ ngữ pháp, cụm collocations và ví dụ thực chiến theo ngữ cảnh người học.
            </p>
          </div>

          <div className="pt-4 mt-3 border-t border-line flex items-center justify-between">
            <span className="text-[11px] font-mono text-ink-mute">HỎI ĐÁP KHÔNG GIỚI HẠN</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-brand">
              Trò chuyện <ArrowRightOutlined className="text-[10px]" />
            </span>
          </div>
        </FlashCardBox>
      </div>
    </div>
  );
};
