import React from 'react';

interface RulerProgressProps {
  percent: number; // 0 to 100
  color?: 'brand' | 'mint' | 'sun' | 'coral';
  height?: number;
  className?: string;
  showTicks?: boolean;
}

export const RulerProgress: React.FC<RulerProgressProps> = ({
  percent,
  color = 'brand',
  height = 14,
  className = '',
  showTicks = true,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const colorMap = {
    brand: 'bg-[var(--brand)]',
    mint: 'bg-[var(--mint)]',
    sun: 'bg-[var(--sun)]',
    coral: 'bg-[var(--coral)]',
  };

  return (
    <div
      className={`ruler-track ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {showTicks && <div className="ruler-ticks" />}
      <div
        className={`ruler-fill ${colorMap[color]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
