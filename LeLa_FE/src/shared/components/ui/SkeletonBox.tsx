import React from 'react';

interface SkeletonBoxProps {
  className?: string;
  height?: string | number;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({ className = '', height = 24 }) => {
  return (
    <div
      className={`animate-pulse bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--radius-btn)] ${className}`}
      style={{ height }}
    />
  );
};
