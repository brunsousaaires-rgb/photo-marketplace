import { motion } from "framer-motion";
import type { Demo } from "../data/routines";

const TEAL = "#1F5E5B";
const TEAL_DARK = "#16302E";
const AMBER = "#D9A441";
const CLAY = "#E3B7A0";
const LINE = "#DCE3E1";

interface ExerciseDemoProps {
  demo: Demo;
  size?: number;
  playing?: boolean;
}

function loop(duration: number) {
  return { duration, repeat: Infinity, ease: "easeInOut" as const };
}

function Head({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r="11" fill={TEAL} />;
}

function Ground({ y = 172 }: { y?: number }) {
  return <line x1="16" y1={y} x2="184" y2={y} stroke={LINE} strokeWidth="4" strokeLinecap="round" />;
}

function Mat({ x = 40, y = 150, w = 120 }: { x?: number; y?: number; w?: number }) {
  return <rect x={x} y={y} width={w} height="10" rx="5" fill={CLAY} opacity="0.55" />;
}

/** Membro que gira em torno de um ponto fixo (pivot), usando origin 0,0 em SVG. */
function RotLimb({
  pivot,
  length,
  angles,
  duration = 1.8,
  width = 9,
  color = TEAL,
  handRadius = 5.5,
}: {
  pivot: [number, number];
  length: number;
  angles: number[];
  duration?: number;
  width?: number;
  color?: string;
  handRadius?: number;
}) {
  return (
    <g transform={`translate(${pivot[0]},${pivot[1]})`}>
      <motion.line
        x1={0}
        y1={0}
        x2={0}
        y2={length}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        style={{ originX: 0, originY: 0 }}
        animate={{ rotate: angles }}
        transition={loop(duration)}
      />
      <motion.circle
        cx={0}
        cy={length}
        r={handRadius}
        fill={color}
        style={{ originX: 0, originY: 0 }}
        animate={{ rotate: angles }}
        transition={loop(duration)}
      />
    </g>
  );
}

export default function ExerciseDemo({ demo, size = 64, playing = true }: ExerciseDemoProps) {
  const content = renderDemo(demo, playing);

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      {content}
    </svg>
  );
}

function still<T>(frames: T[]): T[] {
  // quando "playing" é falso, mostra apenas o primeiro frame (ícone estático)
  return [frames[0]];
}

function renderDemo(demo: Demo, playing: boolean) {
  const a = <T,>(frames: T[]): T[] => (playing ? frames : still(frames));

  switch (demo.type) {
    case "arm-circle": {
      const wide = demo.variant === "wide";
      const pendulum = demo.variant === "pendulum";
      return (
        <>
          <Ground />
          <Head cx={100} cy={50} />
          <line x1="100" y1={pendulum ? 61 : 61} x2="100" y2="120" stroke={TEAL} strokeWidth="10" strokeLinecap="round" />
          <RotLimb
            pivot={[100, 75]}
            length={pendulum ? 55 : wide ? 48 : 34}
            angles={pendulum ? a([-25, 25, -25]) : a([0, 360])}
            duration={pendulum ? 1.6 : 2.4}
          />
          {!pendulum && (
            <RotLimb
              pivot={[100, 75]}
              length={wide ? 48 : 34}
              angles={a([180, 540])}
              duration={2.4}
              color={TEAL_DARK}
            />
          )}
          <line x1="88" y1="120" x2="86" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
          <line x1="112" y1="120" x2="114" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
        </>
      );
    }

    case "arm-raise": {
      const front = demo.variant === "front";
      return (
        <>
          <Ground />
          <Head cx={100} cy={50} />
          <line x1="100" y1="61" x2="100" y2="120" stroke={TEAL} strokeWidth="10" strokeLinecap="round" />
          <RotLimb pivot={[92, 72]} length={44} angles={a(front ? [80, -10, 80] : [95, 5, 95])} duration={1.6} />
          <RotLimb
            pivot={[108, 72]}
            length={44}
            angles={a(front ? [-80, 10, -80] : [-95, -5, -95])}
            duration={1.6}
            color={TEAL_DARK}
          />
          <line x1="88" y1="120" x2="86" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
          <line x1="112" y1="120" x2="114" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
        </>
      );
    }

    case "scapular-squeeze": {
      const shrug = demo.variant === "shrug";
      return (
        <>
          <Ground />
          <motion.g animate={shrug ? { y: a([0, -8, 0]) } : undefined} transition={loop(1.4)}>
            <Head cx={100} cy={50} />
            <line x1="100" y1="61" x2="100" y2="120" stroke={TEAL} strokeWidth="10" strokeLinecap="round" />
          </motion.g>
          <RotLimb pivot={[90, 75]} length={30} angles={a(shrug ? [40, 40] : [40, 90, 40])} duration={1.4} />
          <RotLimb
            pivot={[110, 75]}
            length={30}
            angles={a(shrug ? [-40, -40] : [-40, -90, -40])}
            duration={1.4}
            color={TEAL_DARK}
          />
          <line x1="88" y1="120" x2="86" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
          <line x1="112" y1="120" x2="114" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
        </>
      );
    }

    case "wall-lean": {
      const pushup = demo.variant === "pushup";
      return (
        <>
          <Ground />
          <rect x="150" y="30" width="10" height="142" rx="4" fill={LINE} />
          <motion.g animate={{ x: a(pushup ? [0, 18, 0] : [0, 10, 0]) }} transition={loop(1.7)}>
            <Head cx={100} cy={50} />
            <line x1="100" y1="61" x2="100" y2="120" stroke={TEAL} strokeWidth="10" strokeLinecap="round" />
            <line x1="100" y1="80" x2="148" y2="70" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
            <line x1="88" y1="120" x2="86" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
            <line x1="112" y1="120" x2="114" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
          </motion.g>
        </>
      );
    }

    case "spine-wave": {
      const cobra = demo.variant === "cobra";
      return (
        <>
          <Mat x={30} y={140} w={140} />
          {cobra ? (
            <motion.g animate={{ y: a([0, -14, 0]) }} transition={loop(1.8)}>
              <Head cx={60} cy={120} />
              <path d="M70 122 Q110 130 150 138" stroke={TEAL} strokeWidth="10" strokeLinecap="round" fill="none" />
            </motion.g>
          ) : (
            <motion.path
              d="M40 130 Q100 130 160 130"
              stroke={TEAL}
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              animate={{ d: a(["M40 130 Q100 100 160 130", "M40 130 Q100 155 160 130", "M40 130 Q100 100 160 130"]) }}
              transition={loop(2)}
            />
          )}
          {!cobra && (
            <>
              <Head cx={168} cy={130} />
              <line x1="40" y1="130" x2="30" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
              <line x1="40" y1="130" x2="30" y2="112" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
            </>
          )}
          <line x1="150" y1="138" x2="165" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
        </>
      );
    }

    case "plank": {
      const side = demo.variant === "side";
      return (
        <>
          <Mat x={30} y={148} w={140} />
          <motion.g animate={{ y: a([0, -2.5, 0]) }} transition={loop(1.2)}>
            <Head cx={168} cy={side ? 122 : 128} />
            <line x1="40" y1="130" x2="158" y2={side ? 124 : 128} stroke={TEAL} strokeWidth="11" strokeLinecap="round" />
            <line x1="40" y1="130" x2="30" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
            <line x1="150" y1="128" x2="165" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
          </motion.g>
        </>
      );
    }

    case "floor-limb-raise": {
      const mode = demo.variant ?? "superman";
      if (mode === "figure4") {
        return (
          <>
            <Mat x={30} y={148} w={140} />
            <Head cx={40} cy={130} />
            <line x1="50" y1="130" x2="120" y2="130" stroke={TEAL} strokeWidth="11" strokeLinecap="round" />
            <line x1="120" y1="130" x2="150" y2="110" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
            <motion.line
              x1="120"
              y1="130"
              x2="150"
              y2="145"
              stroke={TEAL_DARK}
              strokeWidth="9"
              strokeLinecap="round"
              style={{ originX: 0.15, originY: 0.15 }}
              animate={{ rotate: a([0, -18, 0]) }}
              transition={loop(1.8)}
            />
          </>
        );
      }
      if (mode === "deadbug") {
        return (
          <>
            <Mat x={30} y={148} w={140} />
            <Head cx={45} cy={125} />
            <line x1="55" y1="125" x2="120" y2="125" stroke={TEAL} strokeWidth="11" strokeLinecap="round" />
            <RotLimb pivot={[120, 122]} length={34} angles={a([-25, 10, -25])} duration={1.7} />
            <RotLimb pivot={[65, 128]} length={34} angles={a([70, 105, 70])} duration={1.7} color={TEAL_DARK} />
            <line x1="120" y1="125" x2="118" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
          </>
        );
      }
      // superman & legraise
      return (
        <>
          <Mat x={30} y={148} w={140} />
          <Head cx={40} cy={130} />
          <line x1="50" y1="130" x2="130" y2="130" stroke={TEAL} strokeWidth="11" strokeLinecap="round" />
          <motion.line
            x1="130"
            y1="130"
            x2="165"
            y2="130"
            stroke={TEAL_DARK}
            strokeWidth="9"
            strokeLinecap="round"
            style={{ originX: 0, originY: 0.5 }}
            animate={{ rotate: a(mode === "legraise" ? [0, -24, 0] : [0, -14, 0]) }}
            transition={loop(1.7)}
          />
          {mode === "superman" && (
            <motion.line
              x1="50"
              y1="130"
              x2="20"
              y2="130"
              stroke={TEAL}
              strokeWidth="9"
              strokeLinecap="round"
              style={{ originX: 1, originY: 0.5 }}
              animate={{ rotate: a([0, 12, 0]) }}
              transition={loop(1.7)}
            />
          )}
        </>
      );
    }

    case "bridge": {
      const single = demo.variant === "single";
      return (
        <>
          <Mat x={30} y={158} w={140} />
          <Head cx={45} cy={140} />
          <line x1="55" y1="140" x2="90" y2="140" stroke={TEAL} strokeWidth="11" strokeLinecap="round" />
          <motion.g animate={{ y: a([0, -16, 0]) }} transition={loop(1.6)}>
            <line x1="90" y1="140" x2="130" y2="140" stroke={TEAL} strokeWidth="11" strokeLinecap="round" />
            <line x1="130" y1="140" x2="130" y2="168" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
          </motion.g>
          {single ? (
            <motion.line
              x1="130"
              y1="140"
              x2="165"
              y2="128"
              stroke={TEAL_DARK}
              strokeWidth="9"
              strokeLinecap="round"
              style={{ originX: 0, originY: 0.5 }}
              animate={{ rotate: a([0, -10, 0]) }}
              transition={loop(1.6)}
            />
          ) : (
            <line x1="130" y1="140" x2="160" y2="168" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
          )}
        </>
      );
    }

    case "trunk-rotate": {
      const seated = demo.variant === "seated" || demo.variant === "forward-fold";
      const fold = demo.variant === "forward-fold";
      return (
        <>
          <Ground />
          {seated && <rect x="70" y="150" width="60" height="10" rx="4" fill={LINE} />}
          <motion.g
            style={{ originX: 0.5, originY: seated ? 0.75 : 0.6 }}
            animate={fold ? { rotate: a([0, 22, 0]) } : { rotate: a([-22, 22, -22]) }}
            transition={loop(1.9)}
          >
            <Head cx={100} cy={seated ? 90 : 50} />
            <line x1="100" y1={seated ? 101 : 61} x2="100" y2={seated ? 150 : 120} stroke={TEAL} strokeWidth="10" strokeLinecap="round" />
            <line x1="82" y1={seated ? 115 : 80} x2="118" y2={seated ? 115 : 80} stroke={TEAL_DARK} strokeWidth="8" strokeLinecap="round" />
          </motion.g>
          {!seated && (
            <>
              <line x1="88" y1="120" x2="86" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
              <line x1="112" y1="120" x2="114" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
            </>
          )}
        </>
      );
    }

    case "squat": {
      const sumo = demo.variant === "sumo";
      const partial = demo.variant === "partial" || demo.variant === "wall" || demo.variant === "chair";
      const wall = demo.variant === "wall";
      const chair = demo.variant === "chair" || demo.variant === "assisted";
      const dip = sumo ? [0, -20, 0] : partial ? [0, -14, 0] : [0, -30, 0];
      return (
        <>
          <Ground />
          {wall && <rect x="150" y="30" width="10" height="142" rx="4" fill={LINE} />}
          {chair && <rect x="150" y="140" width="30" height="32" rx="4" fill={LINE} />}
          <motion.g animate={{ y: a(dip) }} transition={loop(1.8)}>
            <Head cx={100} cy={60} />
            <line x1="100" y1="71" x2="100" y2="120" stroke={TEAL} strokeWidth="10" strokeLinecap="round" />
            <line x1="88" y1="90" x2="70" y2="105" stroke={TEAL} strokeWidth="8" strokeLinecap="round" />
            <line x1="112" y1="90" x2="130" y2="105" stroke={TEAL} strokeWidth="8" strokeLinecap="round" />
            <line
              x1="88"
              y1="120"
              x2={sumo ? "70" : "84"}
              y2="150"
              stroke={TEAL}
              strokeWidth="9"
              strokeLinecap="round"
            />
            <line
              x1="112"
              y1="120"
              x2={sumo ? "130" : "116"}
              y2="150"
              stroke={TEAL}
              strokeWidth="9"
              strokeLinecap="round"
            />
          </motion.g>
        </>
      );
    }

    case "lunge": {
      const stretch = demo.variant === "static-stretch";
      return (
        <>
          <Ground />
          <Mat x={110} y={148} w={50} />
          <Head cx={95} cy={60} />
          <line x1="95" y1="71" x2="100" y2="115" stroke={TEAL} strokeWidth="10" strokeLinecap="round" />
          <motion.line
            x1="100"
            y1="115"
            x2="70"
            y2="150"
            stroke={TEAL}
            strokeWidth="9"
            strokeLinecap="round"
            style={{ originX: 0, originY: 0 }}
            animate={stretch ? undefined : { rotate: a([0, -8, 0]) }}
            transition={loop(1.7)}
          />
          <line
            x1="100"
            y1="115"
            x2="135"
            y2={stretch ? "160" : "150"}
            stroke={TEAL_DARK}
            strokeWidth="9"
            strokeLinecap="round"
          />
          {stretch && <line x1="135" y1="160" x2="150" y2="145" stroke={TEAL_DARK} strokeWidth="8" strokeLinecap="round" />}
        </>
      );
    }

    case "step": {
      const high = demo.variant === "high";
      const stepH = high ? 34 : 22;
      return (
        <>
          <Ground />
          <rect x="110" y={172 - stepH} width="60" height={stepH} rx="3" fill={AMBER} opacity="0.85" />
          <motion.g animate={{ y: a([0, -stepH, 0]), x: a([0, 20, 0]) }} transition={loop(1.9)}>
            <Head cx={90} cy={60} />
            <line x1="90" y1="71" x2="90" y2="120" stroke={TEAL} strokeWidth="10" strokeLinecap="round" />
            <line x1="90" y1="120" x2="78" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
            <line x1="90" y1="120" x2="102" y2="150" stroke={TEAL_DARK} strokeWidth="9" strokeLinecap="round" />
          </motion.g>
        </>
      );
    }

    case "calf-raise": {
      return (
        <>
          <Ground />
          <motion.g animate={{ y: a([0, -14, 0]) }} transition={loop(1.1)}>
            <Head cx={100} cy={60} />
            <line x1="100" y1="71" x2="100" y2="120" stroke={TEAL} strokeWidth="10" strokeLinecap="round" />
            <line x1="88" y1="120" x2="86" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
            <line x1="112" y1="120" x2="114" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
          </motion.g>
        </>
      );
    }

    case "leg-swing": {
      const variant = demo.variant ?? "hip-circles";
      const lying = variant === "lying-abduction";
      const seated = variant === "seated-extension";
      if (seated) {
        return (
          <>
            <rect x="60" y="150" width="70" height="10" rx="4" fill={LINE} />
            <Head cx={80} cy={110} />
            <line x1="80" y1="121" x2="90" y2="150" stroke={TEAL} strokeWidth="10" strokeLinecap="round" />
            <RotLimb pivot={[90, 150]} length={45} angles={a([80, 10, 80])} duration={1.7} color={TEAL_DARK} />
          </>
        );
      }
      if (lying) {
        return (
          <>
            <Mat x={30} y={148} w={140} />
            <Head cx={40} cy={130} />
            <line x1="50" y1="130" x2="120" y2="130" stroke={TEAL} strokeWidth="11" strokeLinecap="round" />
            <line x1="120" y1="130" x2="150" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
            <motion.line
              x1="120"
              y1="130"
              x2="150"
              y2="150"
              stroke={TEAL_DARK}
              strokeWidth="9"
              strokeLinecap="round"
              style={{ originX: 0, originY: 0 }}
              animate={{ rotate: a([0, -30, 0]) }}
              transition={loop(1.6)}
            />
          </>
        );
      }
      const lateral = variant === "lateral-walk" || variant === "standing-abduction";
      return (
        <>
          <Ground />
          <Head cx={90} cy={60} />
          <line x1="90" y1="71" x2="90" y2="120" stroke={TEAL} strokeWidth="10" strokeLinecap="round" />
          <line x1="90" y1="120" x2="88" y2="150" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
          <RotLimb
            pivot={[90, 120]}
            length={32}
            angles={lateral ? a([15, 55, 15]) : a([0, 360])}
            duration={lateral ? 1.4 : 2.6}
            color={TEAL_DARK}
          />
        </>
      );
    }

    case "walk": {
      const long = demo.variant === "long-stride" || demo.variant === "agility";
      return (
        <>
          <Ground />
          <motion.g animate={{ x: a([-10, 10, -10]) }} transition={loop(1.3)}>
            <Head cx={100} cy={55} />
            <line x1="100" y1="66" x2="100" y2="120" stroke={TEAL} strokeWidth="10" strokeLinecap="round" />
            <RotLimb pivot={[100, 120]} length={30} angles={a(long ? [30, -30, 30] : [18, -18, 18])} duration={1.3} />
            <RotLimb
              pivot={[100, 120]}
              length={30}
              angles={a(long ? [-30, 30, -30] : [-18, 18, -18])}
              duration={1.3}
              color={TEAL_DARK}
            />
          </motion.g>
          <motion.path
            d="M130 60 h20 M130 60 l-6 -5 M130 60 l-6 5"
            stroke={AMBER}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            animate={{ x: a([0, 10, 0]), opacity: a([0.4, 1, 0.4]) }}
            transition={loop(1.3)}
          />
        </>
      );
    }

    default:
      return <Head cx={100} cy={100} />;
  }
}
