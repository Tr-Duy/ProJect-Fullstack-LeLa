import React from 'react';

interface HighlighterTextProps {
  children: React.ReactNode;
  className?: string;
}

export const HighlighterText: React.FC<HighlighterTextProps> = ({ children, className = '' }) => {
  return (
    <span className={`highlighter-streak ${className}`}>
      {children}
    </span>
  );
};
