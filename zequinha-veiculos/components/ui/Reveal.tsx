"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in seconds before the reveal starts. */
  delay?: number;
  /** Direction the content travels in from. */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Distance in px travelled during the reveal. */
  distance?: number;
  once?: boolean;
  as?: "div" | "span";
}

const offsets: Record<NonNullable<RevealProps["direction"]>, [number, number]> = {
  up: [0, 1],
  down: [0, -1],
  left: [1, 0],
  right: [-1, 0],
  none: [0, 0],
};

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  distance = 28,
  once = true,
  as = "div",
}: RevealProps) {
  const [xMul, yMul] = offsets[direction];

  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: xMul * distance,
      y: yMul * distance,
      filter: "blur(6px)",
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.9,
        delay,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const Component = motion[as];

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-10% 0px -10% 0px" }}
      variants={variants}
    >
      {children}
    </Component>
  );
}

/** Reveals each word of a phrase individually as it scrolls into view. */
export function WordReveal({
  text,
  className,
  wordClassName,
  staggerDelay = 0.08,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  staggerDelay?: number;
}) {
  const words = text.split(" ");

  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className={`inline-block ${wordClassName ?? ""}`}
          variants={{
            hidden: { opacity: 0, y: "0.6em", filter: "blur(8px)" },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: {
                duration: 0.7,
                delay: i * staggerDelay,
                ease: [0.16, 1, 0.3, 1],
              },
            },
          }}
        >
          {word}&nbsp;
        </motion.span>
      ))}
    </motion.span>
  );
}
