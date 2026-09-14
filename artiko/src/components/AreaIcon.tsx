interface AreaIconProps {
  icon: "shoulder" | "spine" | "knee" | "hip";
  active?: boolean;
  size?: number;
}

const COLOR_ACTIVE = "#1F5E5B";
const COLOR_IDLE = "#5C726F";

export default function AreaIcon({ icon, active = false, size = 26 }: AreaIconProps) {
  const c = active ? COLOR_ACTIVE : COLOR_IDLE;
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const };

  switch (icon) {
    case "shoulder":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 15c0-4 2-7 5-8.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="10" cy="5" r="1.6" fill={c} />
          <path d="M10 6.5c3 1 6 3.5 6 8.5v6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 15v6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "spine":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="4" r="1.6" fill={c} />
          <path
            d="M12 6c-1.5 1.2-1.5 2.4 0 3.6s1.5 2.4 0 3.6-1.5 2.4 0 3.6 1.5 2.4 0 3.6"
            stroke={c}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "knee":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M9 3v7.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="9" cy="12" r="2" fill={c} />
          <path d="M9 14.5c0 3 2.5 4 5 4" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "hip":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="9" cy="6" r="2" stroke={c} strokeWidth="1.8" />
          <path d="M9 8v3c0 3-3 4-3 8" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 11c0 3 3 4 3 8" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}
