import { useCallback, useRef, useState, type PointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface RippleInstance {
  id: number;
  x: number;
  y: number;
  size: number;
}

/**
 * Toque/clique gera um círculo que expande e desaparece a partir do ponto
 * exato do toque — puro CSS/JS (funciona em qualquer navegador), inspirado
 * no Ripple da Canvas UI. A versão deles depende de uma API experimental do
 * Chrome (html-in-canvas, atrás de flag/origin trial) que não roda em
 * Safari, Firefox nem no Chrome mobile padrão — por isso não foi usada aqui
 * diretamente num produto vendido para o público geral.
 */
export function useRipple() {
  const [ripples, setRipples] = useState<RippleInstance[]>([]);
  const nextId = useRef(0);

  const onPointerDown = useCallback((e: PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2.4;
    const id = ++nextId.current;
    setRipples((prev) => [...prev, { id, x, y, size }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 700);
  }, []);

  return { ripples, onPointerDown };
}

interface RippleLayerProps {
  ripples: RippleInstance[];
  color?: string;
}

export function RippleLayer({ ripples, color = "rgba(255,255,255,0.55)" }: RippleLayerProps) {
  if (ripples.length === 0) return null;
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0.5, scale: 0 }}
            animate={{ opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: r.x - r.size / 2,
              top: r.y - r.size / 2,
              width: r.size,
              height: r.size,
              borderRadius: "9999px",
              background: color,
            }}
          />
        ))}
      </AnimatePresence>
    </span>
  );
}
