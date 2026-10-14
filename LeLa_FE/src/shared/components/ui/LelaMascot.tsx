import React from 'react';

interface LelaMascotProps {
  size?: number;
  mood?: 'happy' | 'celebrating' | 'thinking' | 'encouraging';
  className?: string;
}

export const LelaMascot: React.FC<LelaMascotProps> = ({
  size = 64,
  mood = 'happy',
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Lela Mascot"
      role="img"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Soft Shadow Base */}
        <ellipse cx="50" cy="90" rx="30" ry="6" fill="#E4E9F2" opacity="0.6" />

        {/* Speech Bubble Body */}
        <rect
          x="12"
          y="14"
          width="76"
          height="64"
          rx="32"
          fill="#1F5BFF"
        />

        {/* Tiny Speech Tail */}
        <path
          d="M32 76 C 30 84, 22 88, 16 90 C 24 88, 32 84, 38 78 Z"
          fill="#1F5BFF"
        />

        {/* Inner glow / soft highlight */}
        <ellipse cx="50" cy="22" rx="28" ry="6" fill="#FFFFFF" opacity="0.18" />

        {/* Eyes */}
        {mood === 'celebrating' ? (
          <>
            {/* Happy arch eyes */}
            <path
              d="M36 46 Q 41 38 46 46"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M54 46 Q 59 38 64 46"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : (
          <>
            {/* Round Friendly Eyes */}
            <circle cx="41" cy="44" r="5" fill="#FFFFFF" />
            <circle cx="59" cy="44" r="5" fill="#FFFFFF" />
            <circle cx="42.5" cy="42.5" r="2" fill="#1544C9" />
            <circle cx="60.5" cy="42.5" r="2" fill="#1544C9" />
          </>
        )}

        {/* Cheeks */}
        <ellipse cx="33" cy="52" rx="4" ry="2.5" fill="#FF7A1A" opacity="0.4" />
        <ellipse cx="67" cy="52" rx="4" ry="2.5" fill="#FF7A1A" opacity="0.4" />

        {/* Smile */}
        <path
          d="M45 54 Q 50 60 55 54"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Tiny sparkle or party hat if celebrating */}
        {mood === 'celebrating' && (
          <path
            d="M50 6 L53 14 L47 14 Z"
            fill="#FFB703"
          />
        )}
      </svg>
    </div>
  );
};
