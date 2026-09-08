"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { clsx } from "clsx";

export default function MagneticButton({
  children,
  className,
  href,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 15, mass: 0.3 });
  const springY = useSpring(y, { stiffness: 200, damping: 15, mass: 0.3 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    x.set(relX * 0.35);
    y.set(relY * 0.35);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const Comp = href ? motion.a : motion.button;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className="inline-block"
    >
      <Comp
        href={href}
        type={!href ? type : undefined}
        onClick={onClick}
        whileTap={{ scale: 0.94 }}
        className={clsx(
          "group relative inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors",
          className
        )}
      >
        {children}
      </Comp>
    </motion.div>
  );
}
