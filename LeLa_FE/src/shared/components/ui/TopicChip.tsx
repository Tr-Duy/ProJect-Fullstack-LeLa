import React from 'react';

interface TopicChipProps {
  topic?: string | null;
  className?: string;
}

export const TopicChip: React.FC<TopicChipProps> = ({ topic, className = '' }) => {
  const name = topic?.trim() || 'Tổng hợp';
  const lower = name.toLowerCase();

  let style = 'bg-[#FFF1E0] text-[#C2410C] border-[#FFE3C7]'; // Fallback warm brand

  if (lower.includes('business') || lower.includes('kinh doanh') || lower.includes('thương mại')) {
    // Nâu đỏ
    style = 'bg-[#FDF2EE] text-[#8B2500] border-[#FCE2D9]';
  } else if (lower.includes('travel') || lower.includes('du lịch') || lower.includes('di chuyển')) {
    // Xanh ngọc
    style = 'bg-[#E6FFFA] text-[#0D9488] border-[#CCFBF1]';
  } else if (lower.includes('office') || lower.includes('văn phòng') || lower.includes('công sở')) {
    // Vàng nghệ
    style = 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]';
  } else if (lower.includes('daily') || lower.includes('hàng ngày') || lower.includes('đời sống')) {
    // Hồng đào
    style = 'bg-[#FDF2F8] text-[#BE185D] border-[#FCE7F3]';
  } else if (lower.includes('food') || lower.includes('ẩm thực') || lower.includes('nhà hàng')) {
    // Cam đất
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
