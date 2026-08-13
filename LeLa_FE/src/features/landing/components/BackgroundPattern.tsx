export function BackgroundPattern() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none w-full h-full opacity-60">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="brutal-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1D2A3A" strokeWidth="1.5" opacity="0.15" />
          </pattern>
          <pattern id="brutal-dots" width="24" height="24" patternUnits="userSpaceOnUse" x="12" y="12">
             <circle cx="2" cy="2" r="2" fill="#1D2A3A" opacity="0.1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#brutal-grid)" />
      </svg>
    </div>
  );
}
