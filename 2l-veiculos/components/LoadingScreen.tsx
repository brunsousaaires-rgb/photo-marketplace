'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDone(true);
      return;
    }

    const start = performance.now();
    const duration = 1200;
    let frame: number;

    function tick(now: number) {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (pct < 100) {
        frame = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setDone(true), 220);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (done) {
      document.body.style.overflow = '';
    } else {
      document.body.style.overflow = 'hidden';
    }
  }, [done]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bg"
        >
          <motion.span
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={{ opacity: 1, letterSpacing: '0.02em' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-6xl text-gradient-gold sm:text-7xl"
          >
            2L
          </motion.span>

          <div className="mt-8 h-px w-40 overflow-hidden bg-white/10 sm:w-56">
            <motion.div
              className="h-full bg-gold-gradient"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-5 text-[10px] font-medium uppercase tracking-widest2 text-ink-muted"
          >
            Preparando a experiência
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
