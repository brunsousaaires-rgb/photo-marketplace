import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export type MascotMood = "idle" | "happy" | "cheer" | "wave" | "think" | "oops";

interface MascotProps {
  size?: number;
  mood?: MascotMood;
  className?: string;
}

const PRIMARY = "#1F5E5B";
const PRIMARY_DARK = "#16302E";
const ACCENT = "#D9A441";

export default function Mascot({ size = 64, mood = "idle", className }: MascotProps) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 3200 + Math.random() * 1400);
    return () => clearInterval(id);
  }, []);

  const bodyBounce =
    mood === "cheer"
      ? { y: [0, -10, 0, -6, 0], rotate: [0, -4, 0, 4, 0] }
      : mood === "happy"
        ? { y: [0, -4, 0] }
        : mood === "wave"
          ? { rotate: [0, -3, 0, 3, 0] }
          : mood === "think"
            ? { rotate: [0, 2, 0, -2, 0] }
            : { y: [0, -3, 0] };

  const eyeHeight = blink ? 0.5 : mood === "oops" ? 3.5 : mood === "cheer" || mood === "happy" ? 3 : 3.5;
  const eyeShape = mood === "happy" || mood === "cheer";

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      animate={bodyBounce}
      transition={{ duration: mood === "cheer" ? 0.9 : 2.6, repeat: Infinity, ease: "easeInOut" }}
      role="img"
      aria-label="Arti, o mascote da ARTIKO"
    >
      {/* sombra */}
      <ellipse cx="48" cy="86" rx="20" ry="4" fill={PRIMARY_DARK} opacity="0.1" />

      {/* corpo: arco fechado em forma de gota amigável */}
      <path
        d="M48 14C30 14 18 30 18 50C18 68 31 80 48 80C65 80 78 68 78 50C78 30 66 14 48 14Z"
        fill={PRIMARY}
      />
      <path
        d="M48 14C30 14 18 30 18 50C18 68 31 80 48 80"
        fill="none"
        stroke={PRIMARY_DARK}
        strokeOpacity="0.15"
        strokeWidth="2"
      />

      {/* brilho da barriga */}
      <ellipse cx="40" cy="56" rx="10" ry="7" fill="#ffffff" opacity="0.12" />

      {/* faísca âmbar no topo (o "ponto" da marca) */}
      <motion.circle
        cx="48"
        cy="10"
        r="5"
        fill={ACCENT}
        animate={mood === "think" ? { opacity: [1, 0.4, 1] } : { scale: [1, 1.15, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* olhos */}
      {eyeShape ? (
        <>
          <path d="M34 46 Q38 41 42 46" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M54 46 Q58 41 62 46" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <motion.ellipse cx="38" cy="46" rx="3" animate={{ ry: eyeHeight }} fill="#fff" />
          <motion.ellipse cx="58" cy="46" rx="3" animate={{ ry: eyeHeight }} fill="#fff" />
        </>
      )}

      {/* boca */}
      {mood === "oops" ? (
        <ellipse cx="48" cy="58" rx="4.5" ry="5.5" fill="#fff" opacity="0.9" />
      ) : mood === "cheer" || mood === "happy" ? (
        <path d="M36 56 Q48 68 60 56" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M39 58 Q48 63 57 58" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
      )}

      {/* braço aceno (mood wave/cheer) */}
      <motion.g
        style={{ originX: 0.85, originY: 0.35 }}
        animate={
          mood === "wave" || mood === "cheer"
            ? { rotate: [0, -30, 0, -30, 0] }
            : { rotate: 0 }
        }
        transition={{ duration: 0.7, repeat: mood === "wave" || mood === "cheer" ? Infinity : 0, ease: "easeInOut" }}
      >
        <line x1="74" y1="52" x2="88" y2="38" stroke={PRIMARY} strokeWidth="7" strokeLinecap="round" />
        <circle cx="88" cy="38" r="5" fill={PRIMARY} />
      </motion.g>

      {/* pernas */}
      <line x1="38" y1="80" x2="36" y2="90" stroke={PRIMARY} strokeWidth="7" strokeLinecap="round" />
      <line x1="58" y1="80" x2="60" y2="90" stroke={PRIMARY} strokeWidth="7" strokeLinecap="round" />
    </motion.svg>
  );
}
