'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

type CursorState = 'normal' | 'explore' | 'view' | 'drag';

const LABELS: Record<Exclude<CursorState, 'normal'>, string> = {
  explore: 'Explorar',
  view: 'Ver veículo',
  drag: 'Arraste',
};

export default function CustomCursor() {
  const [state, setState] = useState<CursorState>('normal');
  const [visible, setVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    const mql = window.matchMedia('(pointer: fine)');
    setIsDesktop(mql.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    function handleMove(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);

      const target = (e.target as HTMLElement)?.closest<HTMLElement>('[data-cursor]');
      setState((target?.dataset.cursor as CursorState) || 'normal');
    }
    function handleLeave() {
      setVisible(false);
    }

    window.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, [isDesktop, x, y]);

  if (!isDesktop) return null;

  const expanded = state !== 'normal';

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] mix-blend-difference"
      style={{ x: springX, y: springY, opacity: visible ? 1 : 0 }}
    >
      <motion.div
        animate={{
          width: expanded ? 88 : 14,
          height: expanded ? 88 : 14,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="-translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border border-white bg-white/10 backdrop-blur-sm"
      >
        {expanded && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-medium uppercase tracking-widest text-white"
          >
            {LABELS[state as Exclude<CursorState, 'normal'>]}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
}
