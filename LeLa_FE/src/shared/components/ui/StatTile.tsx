import React from 'react';

interface StatTileProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'ink' | 'paper' | 'card' | 'sun';
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  unit,
  subtext,
  icon,
  variant = 'card',
  className = '',
}) => {
  const bgStyles = {
    card: 'bg-white border-2 border-[var(--ink)] text-[var(--ink)] shadow-[var(--shadow-card)]',
    ink: 'bg-[var(--ink)] border-2 border-[var(--ink)] text-[var(--paper)] shadow-[var(--shadow-card)]',
    paper: 'bg-[var(--paper-2)] border-2 border-[var(--ink)] text-[var(--ink)] shadow-[var(--shadow-card)]',
    sun: 'bg-[var(--sun)] border-2 border-[var(--ink)] text-[var(--ink)] shadow-[var(--shadow-card)]',
  }[variant];

  const labelColor = variant === 'ink' ? 'text-[var(--paper-2)] opacity-80' : 'text-[var(--ink-soft)]';

  return (
    <div className={`p-4 rounded-[var(--radius-card)] ${bgStyles} ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className={`text-xs font-mono font-bold uppercase tracking-wider ${labelColor}`}>
          {label}
        </span>
        {icon && <span className="opacity-80">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="mono-num text-3xl md:text-4xl font-bold leading-none">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono font-semibold uppercase opacity-75">
            {unit}
          </span>
        )}
      </div>
      {subtext && (
        <p className={`text-xs mt-2 font-medium ${labelColor}`}>
          {subtext}
        </p>
      )}
    </div>
  );
};
