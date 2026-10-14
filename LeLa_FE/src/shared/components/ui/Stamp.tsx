import React from 'react';

export type StampVariant = 'due' | 'mastered' | 'new' | 'pro' | 'coral' | 'neutral';

interface StampProps {
  children: React.ReactNode;
  variant?: StampVariant;
  rotate?: boolean;
  className?: string;
}

export const Stamp: React.FC<StampProps> = ({
  children,
  variant = 'due',
  rotate = true,
  className = '',
}) => {
  const variantClass = {
    due: 'journal-stamp-due',
    mastered: 'journal-stamp-mastered',
    new: 'journal-stamp-new',
    pro: 'journal-stamp-pro',
    coral: 'journal-stamp-coral',
    neutral: 'bg-[var(--card)] text-[var(--ink)]',
  }[variant];

  return (
    <span
      className={`journal-stamp ${variantClass} ${rotate ? '' : '!rotate-0'} ${className}`}
    >
      {children}
    </span>
  );
};
