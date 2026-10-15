import React from 'react';

export type LelaMood = 'idle' | 'happy' | 'cheer' | 'thinking' | 'sleepy' | 'sad' | 'encouraging' | 'cover' | 'peek';

export interface LelaProps {
  mood?: LelaMood;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  pupilOffset?: number;
}

export const Lela: React.FC<LelaProps> = ({
  mood = 'idle',
  size = 72,
  className = '',
  style,
  pupilOffset = 0,
}) => {
  const resolvedMood = mood === 'encouraging' ? 'happy' : mood;
  const clampedOffset = Math.max(-4, Math.min(4, pupilOffset));

  // Map moods to CSS classes for natural, lightweight animations
  const moodClass = {
    idle: 'lela-bounce',
    happy: 'lela-happy',
    cheer: 'lela-cheer',
    thinking: 'lela-bounce',
    sleepy: '',
    sad: '',
    encouraging: 'lela-happy',
    cover: '',
    peek: '',
  }[resolvedMood];

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${moodClass} ${className}`}
      style={{ width: size, height: size, ...style }}
      aria-label={`Linh vật Lela (${mood})`}
      role="img"
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="lela-orange-grad" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FB923C" />
            <stop offset="0.6" stopColor="#F97316" />
            <stop offset="1" stopColor="#EA580C" />
          </linearGradient>
          <filter id="lela-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#78350F" floodOpacity="0.16" />
          </filter>
        </defs>

        {/* --- SLEEPY FLOATING ZZZ --- */}
        {mood === 'sleepy' && (
          <g className="font-display font-bold text-[#EA580C] fill-[#EA580C]" style={{ pointerEvents: 'none' }}>
            <text x="75" y="24" fontSize="11" fontWeight="700" className="lela-zzz-1">z</text>
            <text x="83" y="15" fontSize="13" fontWeight="800" className="lela-zzz-2">Z</text>
            <text x="91" y="6" fontSize="15" fontWeight="900" className="lela-zzz-3">Z</text>
          </g>
        )}

        {/* --- THINKING PULSING DOTS --- */}
        {mood === 'thinking' && (
          <g transform="translate(68, 6)">
            <circle cx="6" cy="18" r="3" fill="#FFF0DC" stroke="#F97316" strokeWidth="1.5" />
            <circle cx="14" cy="12" r="4.5" fill="#FFF0DC" stroke="#F97316" strokeWidth="1.5" />
            <rect x="18" y="-4" width="22" height="14" rx="7" fill="#FFF0DC" stroke="#F97316" strokeWidth="1.5" />
            <circle cx="24" cy="3" r="1.5" fill="#EA580C" className="animate-pulse" />
            <circle cx="29" cy="3" r="1.5" fill="#EA580C" className="animate-pulse" style={{ animationDelay: '200ms' }} />
            <circle cx="34" cy="3" r="1.5" fill="#EA580C" className="animate-pulse" style={{ animationDelay: '400ms' }} />
          </g>
        )}

        {/* --- CHEER WAVING HANDS --- */}
        {mood === 'cheer' && (
          <g>
            <path
              d="M14 54 C8 42, 6 36, 12 32 C16 30, 20 36, 22 48"
              fill="#F97316"
              stroke="#EA580C"
              strokeWidth="2"
              strokeLinecap="round"
              className="origin-[22px_48px] animate-[lela-cheer-wave_1.2s_ease-in-out_infinite]"
            />
            <path
              d="M86 54 C92 42, 94 36, 88 32 C84 30, 80 36, 78 48"
              fill="#F97316"
              stroke="#EA580C"
              strokeWidth="2"
              strokeLinecap="round"
              className="origin-[78px_48px] animate-[lela-cheer-wave_1.2s_ease-in-out_infinite_reverse]"
            />
          </g>
        )}

        {/* --- MAIN BODY: Round speech bubble with small tail --- */}
        <g filter="url(#lela-shadow)">
          {/* Tail */}
          <path
            d="M32 78 C25 84, 18 92, 14 96 C22 93, 30 89, 38 85 Z"
            fill="url(#lela-orange-grad)"
            stroke="#EA580C"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Round Bubble Head */}
          <circle
            cx="50"
            cy="48"
            r="38"
            fill="url(#lela-orange-grad)"
            stroke="#EA580C"
            strokeWidth="2.5"
          />
          {/* Subtle Top Gloss Highlight */}
          <path
            d="M26 30 C32 20, 50 16, 68 20 C62 23, 44 23, 30 31"
            fill="#FFFFFF"
            opacity="0.32"
          />
        </g>

        {/* --- CHEEKS (Soft rosy blush) --- */}
        {mood !== 'sad' && (
          <>
            <ellipse cx="28" cy="54" rx="5" ry="3" fill="#F43F5E" opacity="0.35" />
            <ellipse cx="72" cy="54" rx="5" ry="3" fill="#F43F5E" opacity="0.35" />
          </>
        )}

        {/* --- EYES --- */}
        {mood === 'happy' || mood === 'cheer' ? (
          // Happy curved eyes (arches)
          <g stroke="#2A1300" strokeWidth="3.5" strokeLinecap="round">
            <path d="M30 46 C34 40, 42 40, 46 46" />
            <path d="M54 46 C58 40, 66 40, 70 46" />
          </g>
        ) : mood === 'sleepy' ? (
          // Sleepy half-closed eyes
          <g stroke="#2A1300" strokeWidth="3" strokeLinecap="round">
            <path d="M30 49 Q38 52 46 49" />
            <path d="M54 49 Q62 52 70 49" />
            <path d="M30 49 Q38 46 46 49" opacity="0.3" strokeWidth="1" />
            <path d="M54 49 Q62 46 70 49" opacity="0.3" strokeWidth="1" />
          </g>
        ) : mood === 'sad' ? (
          // Sad lowered eyes + teardrop
          <g>
            <circle cx="38" cy="48" r="4.5" fill="#2A1300" />
            <circle cx="62" cy="48" r="4.5" fill="#2A1300" />
            <path d="M34 42 L42 45" stroke="#2A1300" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M66 42 L58 45" stroke="#2A1300" strokeWidth="2.5" strokeLinecap="round" />
            {/* Tiny tear */}
            <path d="M68 54 C66 57, 66 59, 68 60 C70 59, 70 57, 68 54 Z" fill="#38BDF8" />
          </g>
        ) : mood === 'cover' ? (
          // Two hands covering both eyes
          <g>
            {/* Left Hand covering left eye */}
            <ellipse cx="38" cy="46" rx="10" ry="8" fill="url(#lela-orange-grad)" stroke="#EA580C" strokeWidth="2" />
            <path d="M33 43 C35 41, 37 41, 38 43" stroke="#EA580C" strokeWidth="1.5" />
            <path d="M38 43 C40 41, 42 41, 43 43" stroke="#EA580C" strokeWidth="1.5" />
            {/* Right Hand covering right eye */}
            <ellipse cx="62" cy="46" rx="10" ry="8" fill="url(#lela-orange-grad)" stroke="#EA580C" strokeWidth="2" />
            <path d="M57 43 C59 41, 61 41, 62 43" stroke="#EA580C" strokeWidth="1.5" />
            <path d="M62 43 C64 41, 66 41, 67 43" stroke="#EA580C" strokeWidth="1.5" />
          </g>
        ) : mood === 'peek' ? (
          // Left hand covers left eye, right eye peeking through slightly parted fingers
          <g>
            {/* Left Hand covering left eye */}
            <ellipse cx="38" cy="46" rx="10" ry="8" fill="url(#lela-orange-grad)" stroke="#EA580C" strokeWidth="2" />
            <path d="M33 43 C35 41, 37 41, 38 43" stroke="#EA580C" strokeWidth="1.5" />
            <path d="M38 43 C40 41, 42 41, 43 43" stroke="#EA580C" strokeWidth="1.5" />
            {/* Right Eye peeking curiously */}
            <circle cx="62" cy="46" r="6" fill="#2A1300" />
            <circle cx="60.5" cy="44" r="2.2" fill="#FFFFFF" />
            <circle cx="64.5" cy="47.5" r="1.1" fill="#FFFFFF" />
            {/* Right Hand slightly below / parted */}
            <ellipse cx="64" cy="53" rx="9" ry="6" fill="url(#lela-orange-grad)" stroke="#EA580C" strokeWidth="1.5" />
            <path d="M60 51 C62 49, 64 49, 66 51" stroke="#EA580C" strokeWidth="1.2" />
          </g>
        ) : (
          // Default / Idle / Thinking: Big round glossy black eyes with white sparkles & pupil tracking
          <g className="lela-eye-blink">
            {/* Left Eye */}
            <circle cx={38 + clampedOffset} cy="46" r="6" fill="#2A1300" />
            <circle cx={36 + clampedOffset} cy="44" r="2.2" fill="#FFFFFF" />
            <circle cx={40.5 + clampedOffset} cy="47.5" r="1.1" fill="#FFFFFF" />

            {/* Right Eye */}
            <circle cx={62 + clampedOffset} cy="46" r="6" fill="#2A1300" />
            <circle cx={60 + clampedOffset} cy="44" r="2.2" fill="#FFFFFF" />
            <circle cx={64.5 + clampedOffset} cy="47.5" r="1.1" fill="#FFFFFF" />
          </g>
        )}

        {/* --- MOUTH --- */}
        {mood === 'happy' || mood === 'cheer' ? (
          // Open beaming smile with tongue
          <g>
            <path
              d="M38 54 Q50 68 62 54"
              fill="#991B1B"
              stroke="#2A1300"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M44 60 Q50 63 56 60 Q50 66 44 60"
              fill="#FB7185"
            />
          </g>
        ) : mood === 'sleepy' ? (
          // Small sleepy cute mouth
          <ellipse cx="50" cy="58" rx="2.5" ry="3.5" fill="#7C2D12" />
        ) : mood === 'sad' ? (
          // Downward sad curve
          <path
            d="M42 60 Q50 54 58 60"
            fill="none"
            stroke="#2A1300"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ) : mood === 'cover' ? (
          // Shy cute timid mouth
          <path
            d="M45 56 Q50 59 55 56"
            fill="none"
            stroke="#2A1300"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        ) : mood === 'peek' ? (
          // Playful small smirk
          <path
            d="M45 56 Q51 60 57 55"
            fill="none"
            stroke="#2A1300"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        ) : mood === 'thinking' ? (
          // Tilted thoughtful small mouth
          <path
            d="M45 56 Q52 58 55 54"
            fill="none"
            stroke="#2A1300"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ) : (
          // Idle: Warm pleasant curve
          <path
            d="M42 55 Q50 62 58 55"
            fill="none"
            stroke="#2A1300"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};

// Backwards-compatible alias for LelaMascot
export const LelaMascot = Lela;

export default Lela;
