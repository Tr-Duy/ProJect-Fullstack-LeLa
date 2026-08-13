import React from 'react';

interface AiTutorMascotIconProps {
  className?: string;
  size?: number;
}

export const AiTutorMascotIcon: React.FC<AiTutorMascotIconProps> = ({
  className = '',
  size = 36,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Robot Antenna with Yellow Sparkle */}
      <circle cx="24" cy="6" r="3" fill="#FFD700" stroke="#1D2A3A" strokeWidth="2" />
      <line x1="24" y1="9" x2="24" y2="13" stroke="#1D2A3A" strokeWidth="2.5" strokeLinecap="round" />

      {/* Mascot Robot Head */}
      <rect
        x="10"
        y="13"
        width="28"
        height="22"
        rx="6"
        fill="#FFFFFF"
        stroke="#1D2A3A"
        strokeWidth="3"
      />

      {/* Robot Ear Caps */}
      <rect x="6" y="20" width="4" height="8" rx="2" fill="#F05A4A" stroke="#1D2A3A" strokeWidth="2" />
      <rect x="38" y="20" width="4" height="8" rx="2" fill="#F05A4A" stroke="#1D2A3A" strokeWidth="2" />

      {/* Screen / Eye Visor Area */}
      <rect
        x="14"
        y="17"
        width="20"
        height="9"
        rx="4"
        fill="#1D2A3A"
      />

      {/* Friendly Glowing Eyes */}
      <circle cx="19" cy="21.5" r="2" fill="#70C2D1" />
      <circle cx="29" cy="21.5" r="2" fill="#70C2D1" />

      {/* Happy Smile */}
      <path
        d="M20 30 Q24 33 28 30"
        stroke="#1D2A3A"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Open Book Held by Mascot */}
      <path
        d="M13 37 C18 35 22 36 24 38 C26 36 30 35 35 37 V43 C30 41 26 42 24 44 C22 42 18 41 13 43 Z"
        fill="#F05A4A"
        stroke="#1D2A3A"
        strokeWidth="2"
      />
      <line x1="24" y1="38" x2="24" y2="44" stroke="#1D2A3A" strokeWidth="2" />

      {/* Sparkles ✨ */}
      <path
        d="M37 8 L38.5 11 L41.5 12.5 L38.5 14 L37 17 L35.5 14 L32.5 12.5 L35.5 11 Z"
        fill="#FFD700"
        stroke="#1D2A3A"
        strokeWidth="1.5"
      />
    </svg>
  );
};
