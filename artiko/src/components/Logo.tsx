import { motion } from "framer-motion";

interface LogoProps {
  size?: number;
  variant?: "light" | "dark";
  animated?: boolean;
}

export default function Logo({ size = 32, variant = "light", animated = false }: LogoProps) {
  const stroke = variant === "dark" ? "#F1F3F2" : "#1F5E5B";
  const dotFill = variant === "dark" ? "#F1F3F2" : "#1F5E5B";

  const path = (
    <path
      d="M10 34C10 24 16 14 24 10C32 14 38 24 38 34"
      stroke={stroke}
      strokeWidth="4"
      strokeLinecap="round"
    />
  );

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {animated ? (
        <motion.path
          d="M10 34C10 24 16 14 24 10C32 14 38 24 38 34"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      ) : (
        path
      )}
      <motion.circle
        cx="24"
        cy="10"
        r="3.5"
        fill="#D9A441"
        initial={animated ? { scale: 0 } : undefined}
        animate={animated ? { scale: 1 } : undefined}
        transition={{ delay: 0.9, type: "spring", stiffness: 300, damping: 12 }}
      />
      <circle cx="10" cy="34" r="3.5" fill={dotFill} />
      <circle cx="38" cy="34" r="3.5" fill={dotFill} />
    </svg>
  );
}
