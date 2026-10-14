import React from 'react';

interface StatChipProps {
  icon: React.ReactNode;
  label?: string;
  value: string | number;
  className?: string;
  onClick?: () => void;
}

export const StatChip: React.FC<StatChipProps> = ({
  icon,
  label,
  value,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-[var(--surface-2)] text-[var(--text)] text-xs sm:text-sm font-semibold select-none transition-colors ${
        onClick ? 'cursor-pointer hover:bg-[var(--border)]' : ''
      } ${className}`}
    >
      <span className="shrink-0 flex items-center justify-center text-sm">{icon}</span>
      {label && <span className="text-[var(--text-3)] font-normal hidden md:inline">{label}</span>}
      <span className="tabular-nums font-semibold">{value}</span>
    </div>
  );
};
