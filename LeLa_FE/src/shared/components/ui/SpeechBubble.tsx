import React from 'react';

interface SpeechBubbleProps {
  children: React.ReactNode;
  variant?: 'brand' | 'surface' | 'white';
  tail?: 'bottom-left' | 'bottom-right' | 'none';
  className?: string;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  children,
  variant = 'brand',
  tail = 'bottom-left',
  className = '',
}) => {
  const variantStyles = {
    brand: 'bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)]',
    surface: 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]',
    white: 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-[var(--shadow-sm)]',
  }[variant];

  const tailStyles = {
    'bottom-left': 'speech-bubble-bottom-left',
    'bottom-right': '',
    none: '',
  }[tail];

  return (
    <div
      className={`relative inline-flex items-center px-3.5 py-1.5 rounded-[14px] text-xs sm:text-sm font-medium ${variantStyles} ${tailStyles} ${className}`}
    >
      {children}
    </div>
  );
};
