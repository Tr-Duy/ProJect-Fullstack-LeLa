import React from 'react';

export interface HighlighterTextProps {
  children?: React.ReactNode;
  text?: string;
  highlight?: string;
  className?: string;
}

export const HighlighterText: React.FC<HighlighterTextProps> = ({
  children,
  text,
  highlight,
  className = '',
}) => {
  if (text && highlight && text.includes(highlight)) {
    const parts = text.split(highlight);
    return (
      <span className={className}>
        {parts[0]}
        <span className="highlighter-streak">{highlight}</span>
        {parts.slice(1).join(highlight)}
      </span>
    );
  }

  return (
    <span className={`highlighter-streak ${className}`}>
      {children ?? text}
    </span>
  );
};
