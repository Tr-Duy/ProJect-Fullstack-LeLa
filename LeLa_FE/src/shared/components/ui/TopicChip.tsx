import React from 'react';

interface TopicChipProps {
  topic?: string | null;
  className?: string;
}

export const TopicChip: React.FC<TopicChipProps> = ({ topic, className = '' }) => {
  const name = topic?.trim() || 'Tổng hợp';
  const lower = name.toLowerCase();

  let style = 'bg-[#EEF3FF] text-[#1544C9] border-[#DCE7FF]'; // Fallback brand

  if (lower.includes('business') || lower.includes('kinh doanh') || lower.includes('thương mại')) {
    // Chàm
    style = 'bg-[#EEF2FF] text-[#3730A3] border-[#E0E7FF]';
  } else if (lower.includes('travel') || lower.includes('du lịch') || lower.includes('di chuyển')) {
    // Xanh ngọc
    style = 'bg-[#E6FFFA] text-[#0D9488] border-[#CCFBF1]';
  } else if (lower.includes('office') || lower.includes('văn phòng') || lower.includes('công sở')) {
    // Hổ phách
    style = 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]';
  } else if (lower.includes('daily') || lower.includes('hàng ngày') || lower.includes('đời sống')) {
    // Hồng
    style = 'bg-[#FDF2F8] text-[#BE185D] border-[#FCE7F3]';
  } else if (lower.includes('food') || lower.includes('ẩm thực') || lower.includes('nhà hàng')) {
    // Cam
    style = 'bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5]';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${style} ${className}`}
    >
      {name}
    </span>
  );
};
