import React from 'react';

export type StampVariant =
  | 'due'
  | 'mastered'
  | 'new'
  | 'pro'
  | 'coral'
  | 'neutral'
  | 'sun'
  | 'brand'
  | 'mint';

interface StampProps {
  children?: React.ReactNode;
  text?: string;
  variant?: StampVariant;
  rotate?: boolean;
  className?: string;
}

export const Stamp: React.FC<StampProps> = ({
  children,
  text,
  variant = 'due',
  rotate = true,
  className = '',
}) => {
  const content = children ?? text;

  const variantClass: Record<StampVariant, string> = {
    due: 'journal-stamp-due',
    mastered: 'journal-stamp-mastered',
    new: 'journal-stamp-new',
    pro: 'journal-stamp-pro',
    coral: 'journal-stamp-coral',
    neutral: 'bg-[var(--card)] text-[var(--ink)] border-[var(--ink)]',
    sun: 'bg-[var(--sun)] text-[var(--ink)] border-[var(--ink)]',
    brand: 'bg-[var(--brand)] text-white border-[var(--ink)]',
    mint: 'journal-stamp-mastered',
  };

  return (
    <span
      className={`journal-stamp ${variantClass[variant] || variantClass.due} ${
        rotate ? '' : '!rotate-0'
      } ${className}`}
    >
      {content}
    </span>
  );
};
