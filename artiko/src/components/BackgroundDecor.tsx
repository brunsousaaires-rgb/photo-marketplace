import { motion, useReducedMotion } from "framer-motion";

export default function BackgroundDecor() {
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute -left-32 -top-32 h-80 w-80 rounded-full opacity-40 blur-3xl sm:h-[28rem] sm:w-[28rem]"
        style={{ background: "radial-gradient(circle, #1F5E5B33, transparent 70%)" }}
        animate={reduce ? undefined : { y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-24 top-1/3 h-72 w-72 rounded-full opacity-30 blur-3xl sm:h-96 sm:w-96"
        style={{ background: "radial-gradient(circle, #D9A44133, transparent 70%)" }}
        animate={reduce ? undefined : { y: [0, -24, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-6rem] left-1/4 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #E3B7A044, transparent 70%)" }}
        animate={reduce ? undefined : { y: [0, 16, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
