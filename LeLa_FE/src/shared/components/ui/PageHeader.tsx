import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[var(--border)] ${className}`}
    >
      <div className="space-y-1">
        {badge && <div className="mb-1.5">{badge}</div>}
        <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[var(--text)]">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-[var(--text-2)] max-w-2xl font-normal leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
};
