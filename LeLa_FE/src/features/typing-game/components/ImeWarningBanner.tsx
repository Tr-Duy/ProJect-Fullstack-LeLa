import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ImeWarningBanner: React.FC = () => {
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handleCompositionStart = () => {
      if (!isDismissed) {
        setShowWarning(true);
      }
    };

    window.addEventListener('compositionstart', handleCompositionStart);
    return () => {
      window.removeEventListener('compositionstart', handleCompositionStart);
    };
  }, [isDismissed]);

  if (!showWarning || isDismissed) return null;

  return (
    <div className="w-full bg-amber-100 border-[2px] border-amber-500 rounded-lg p-2.5 mb-3 flex items-center justify-between text-amber-900 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 animate-bounce" />
        <span className="text-xs font-bold">
          Phát hiện bộ gõ tiếng Việt (Telex/VNI/EVKey)! Hãy chuyển sang chế độ <strong className="underline">tiếng Anh (ENG)</strong> để tránh bị nuốt phím khi gõ từ tiếng Anh.
        </span>
      </div>
      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        className="p-1 hover:bg-amber-200 rounded transition-colors text-amber-700"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
