import React from 'react';
import { HighlighterText } from './HighlighterText';

interface PageHeaderProps {
  title: string;
  highlightWord?: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  highlightWord,
  description,
  badge,
  actions,
  className = '',
}) => {
  const renderTitle = () => {
    if (!highlightWord) return title;
    const parts = title.split(new RegExp(`(${highlightWord})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === highlightWord.toLowerCase() ? (
        <HighlighterText key={index}>{part}</HighlighterText>
      ) : (
        part
      )
    );
  };

  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--line)] mb-6 ${className}`}>
      <div className="space-y-1">
        {badge && <div className="mb-2">{badge}</div>}
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
          {renderTitle()}
        </h1>
        {description && (
          <p className="text-sm md:text-base text-[var(--ink-soft)] max-w-2xl font-normal">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
};
