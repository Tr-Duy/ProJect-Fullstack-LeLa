import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface PressableProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  hoverY?: number;
  tapScale?: number;
}

export const Pressable: React.FC<PressableProps> = ({
  children,
  onClick,
  className = '',
  style,
  hoverY = -4,
  tapScale = 0.97,
}) => {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div onClick={onClick} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: hoverY }}
      whileTap={{ scale: tapScale }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export default Pressable;
