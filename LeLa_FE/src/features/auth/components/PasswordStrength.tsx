import React, { useMemo } from 'react';

interface PasswordStrengthProps {
  password?: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = '' }) => {
  const { score, label, color } = useMemo(() => {
    if (!password) {
      return { score: 0, label: '', color: '' };
    }

    let points = 0;
    if (password.length >= 6) points++;
    if (password.length >= 8) points++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points++;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) points++;

    const scoreClamped = Math.min(4, Math.max(1, points));

    switch (scoreClamped) {
      case 1:
        return { score: 1, label: 'Yếu', color: 'var(--danger)' };
      case 2:
        return { score: 2, label: 'Vừa', color: 'var(--warning)' };
      case 3:
        return { score: 3, label: 'Khá', color: 'var(--sun)' };
      case 4:
      default:
        return { score: 4, label: 'Mạnh', color: 'var(--success)' };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-3)] font-medium">Độ mạnh mật khẩu</span>
        <span className="font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className="h-full rounded-full transition-all duration-300"
            style={{
              backgroundColor: step <= score ? color : 'var(--border)',
            }}
          />
        ))}
      </div>
    </div>
  );
};
