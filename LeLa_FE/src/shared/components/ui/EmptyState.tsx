import React from 'react';
import { Button } from 'antd';
import { LelaMascot } from './LelaMascot';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  useMascot?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  className = '',
  useMascot = true,
}) => {
  return (
    <div
      className={`p-8 md:p-10 text-center flex flex-col items-center justify-center space-y-3 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-[var(--shadow-sm)] ${className}`}
    >
      <div className="mb-2">
        {icon ? (
          <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-2xl text-[var(--brand)]">
            {icon}
          </div>
        ) : useMascot ? (
          <LelaMascot size={72} mood="happy" />
        ) : null}
      </div>

      <h3 className="text-base sm:text-lg font-bold font-display text-[var(--text)]">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-[var(--text-2)] max-w-md leading-relaxed">
          {description}
        </p>
      )}

      {actionText && onAction && (
        <Button
          type="primary"
          onClick={onAction}
          className="mt-2 h-10 px-5 font-semibold text-xs sm:text-sm"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};
