import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export interface CountUpProps {
  value: number;
  duration?: number; // default 700ms
  formatter?: (val: number) => string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 700,
  formatter = (v) => v.toLocaleString('vi-VN'),
  className = '',
}) => {
  const reduce = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplayValue(value);
      return;
    }

    let startTimestamp: number | null = null;
    const startValue = 0;
    const targetValue = value;

    if (targetValue === 0) {
      setDisplayValue(0);
      return;
    }

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Ease out cubic: 1 - pow(1 - progress, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (targetValue - startValue) * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration, reduce]);

  return <span className={`tabular-nums ${className}`}>{formatter(displayValue)}</span>;
};

export default CountUp;
