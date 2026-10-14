import React from 'react';

interface SkeletonBoxProps {
  className?: string;
  height?: string | number;
  width?: string | number;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  className = '',
  height = 24,
  width,
}) => {
  return (
    <div
      className={`animate-pulse bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-btn)] ${className}`}
      style={{ height, width }}
    />
  );
};
