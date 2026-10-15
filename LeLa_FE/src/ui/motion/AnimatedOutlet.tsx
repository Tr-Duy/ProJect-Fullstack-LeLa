import { motion, useReducedMotion } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';
import { useEffect } from 'react';

export function AnimatedOutlet() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const reduce = useReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {outlet}
    </motion.div>
  );
}

export default AnimatedOutlet;
