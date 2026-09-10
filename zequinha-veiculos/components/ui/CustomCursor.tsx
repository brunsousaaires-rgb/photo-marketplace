"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cursor customizado discreto (desktop apenas — some automaticamente em
 * telas touch via CSS `@media (hover: none)`). Reage a elementos com
 * `data-cursor="view"` (mostra "VER"), `data-cursor="link"` (expande) ou
 * `data-cursor="image"` (leve expansão).
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    let ringX = 0;
    let ringY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let raf = 0;

    const move = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      }

      const target = (e.target as HTMLElement)?.closest("[data-cursor]") as
        | HTMLElement
        | null;
      if (target) {
        setActive(true);
        setLabel(target.dataset.cursor === "view" ? "VER" : "");
      } else {
        setActive(false);
        setLabel("");
      }
    };

    const loop = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot hidden md:block" />
      <div
        ref={ringRef}
        className={`cursor-ring hidden md:flex items-center justify-center ${active ? "is-active" : ""}`}
      >
        {label && (
          <span className="text-[10px] font-semibold tracking-widest text-turquoise-300">
            {label}
          </span>
        )}
      </div>
    </>
  );
}
