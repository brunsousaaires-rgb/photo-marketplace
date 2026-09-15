import { motion } from "framer-motion";
import clsx from "clsx";

const TEAL = "#1F5E5B";
const MUTED = "#5C726F";

function EquipIcon({ icon, color }: { icon: string; size?: number; color: string }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" as const };
  switch (icon) {
    case "hand":
      return (
        <svg {...common}>
          <path
            d="M7 12V6a1.5 1.5 0 0 1 3 0v5M10 11V4.5a1.5 1.5 0 0 1 3 0V11m0-.5V6a1.5 1.5 0 0 1 3 0v6m0-3a1.5 1.5 0 0 1 3 0v4c0 3.5-2 6.5-6 6.5s-6-2-7-4.5L5 15.5c-.6-1-.3-2 .6-2.4.7-.3 1.4 0 1.9.6"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "mat":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="8" rx="2" stroke={color} strokeWidth="1.5" />
          <path d="M7 8v8M11 8v8" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case "band":
      return (
        <svg {...common}>
          <path d="M4 12c4-6 12-6 16 0" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M4 14c4 6 12 6 16 0" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
        </svg>
      );
    case "dumbbell":
      return (
        <svg {...common}>
          <rect x="3" y="10" width="4" height="4" rx="1" fill={color} />
          <rect x="17" y="10" width="4" height="4" rx="1" fill={color} />
          <line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth="2" />
        </svg>
      );
    case "kettlebell":
      return (
        <svg {...common}>
          <path d="M9 8a3 3 0 1 1 6 0" stroke={color} strokeWidth="1.6" fill="none" />
          <circle cx="12" cy="15" r="6" stroke={color} strokeWidth="1.6" />
        </svg>
      );
    case "bench":
      return (
        <svg {...common}>
          <rect x="4" y="9" width="16" height="4" rx="1.5" stroke={color} strokeWidth="1.5" />
          <line x1="6" y1="13" x2="6" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="18" y1="13" x2="18" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "chair":
      return (
        <svg {...common}>
          <path
            d="M6 4v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4M6 20v-3M18 20v-3M6 8h12"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "ball":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.6" />
          <path d="M12 4v16M4 12h16" stroke={color} strokeWidth="1.2" opacity="0.6" />
        </svg>
      );
    default:
      return <svg {...common} />;
  }
}

interface EquipmentOptionProps {
  label: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
  index?: number;
}

export default function EquipmentOption({ label, icon, selected, onClick, index = 0 }: EquipmentOptionProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileTap={{ scale: 0.96 }}
      aria-pressed={selected}
      className={clsx(
        "flex flex-col items-center gap-1.5 rounded-xl border-[1.5px] p-3 text-center transition-colors",
        selected ? "border-primary bg-primary-soft" : "border-line bg-surface hover:border-primary/50"
      )}
    >
      <EquipIcon icon={icon} color={selected ? TEAL : MUTED} />
      <span className={clsx("text-[11.5px] leading-tight", selected ? "font-semibold text-primary-dark" : "text-muted")}>
        {label}
      </span>
    </motion.button>
  );
}
