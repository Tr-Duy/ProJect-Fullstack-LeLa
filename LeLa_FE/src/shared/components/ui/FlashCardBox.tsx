import React from 'react';

interface FlashCardBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  notch?: boolean;
  className?: string;
}

export const FlashCardBox: React.FC<FlashCardBoxProps> = ({
  children,
  interactive = false,
  notch = true,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`journal-card ${notch ? 'flashcard-clip flashcard-notch' : ''} ${
        interactive ? 'journal-card-interactive cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
