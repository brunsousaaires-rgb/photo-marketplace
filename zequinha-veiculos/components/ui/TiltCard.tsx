"use client";

import { ReactNode, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

/**
 * Card com profundidade física no hover: leve inclinação 3D seguindo o
 * cursor + brilho dinâmico na posição do mouse, no espírito da direção de
 * "acabamento" (cards de preço parecerem físicos no hover, com profundidade
 * e inclinação leve). Desliga sozinho em touch e em prefers-reduced-motion.
 */
export function TiltCard({
  children,
  className,
  style,
  maxTilt = 7,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const disabledRef = useRef<boolean | null>(null);

  const rotateX = useSpring(useMotionValue(0), { stiffness: 250, damping: 22 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 250, damping: 22 });
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareOpacity = useSpring(useMotionValue(0), { stiffness: 220, damping: 26 });
  const glareBackground = useMotionTemplate`radial-gradient(280px circle at ${glareX}% ${glareY}%, rgba(126,232,220,0.16), transparent 65%)`;

  function isDisabled() {
    if (disabledRef.current === null) {
      disabledRef.current =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        window.matchMedia("(hover: none), (pointer: coarse)").matches;
    }
    return disabledRef.current;
  }

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isDisabled()) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    rotateY.set((px - 0.5) * maxTilt * 2);
    rotateX.set(-(py - 0.5) * maxTilt * 2);
    glareX.set(px * 100);
    glareY.set(py * 100);
    glareOpacity.set(1);
  }

  function handleLeave() {
    rotateX.set(0);
    rotateY.set(0);
    glareOpacity.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ ...style, rotateX, rotateY, transformPerspective: 900 }}
      className={className}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
        style={{ background: glareBackground, opacity: glareOpacity }}
      />
      {children}
    </motion.div>
  );
}
