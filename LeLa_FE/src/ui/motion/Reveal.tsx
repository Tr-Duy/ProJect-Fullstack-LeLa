import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  duration = 0.24,
  y = 16,
  className = '',
  style,
}) => {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
