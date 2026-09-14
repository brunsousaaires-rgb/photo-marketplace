import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Logo from "./Logo";

interface HeaderProps {
  step?: number;
  totalSteps?: number;
}

export default function Header({ step, totalSteps = 3 }: HeaderProps) {
  const showProgress = typeof step === "number" && step > 0 && step <= totalSteps;

  return (
    <header className="mx-auto flex w-full max-w-xl items-center justify-between px-1 py-2 sm:max-w-2xl">
      <Link to="/" className="flex items-center gap-2.5">
        <Logo size={30} />
        <span className="font-display text-[19px] font-semibold tracking-wide text-primary-dark">
          ARTIKO
        </span>
      </Link>
      {showProgress && (
        <div className="flex items-center gap-1.5" aria-label={`Etapa ${step} de ${totalSteps}`}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              className="h-1 w-5 rounded-full sm:w-7"
              initial={false}
              animate={{ backgroundColor: (step ?? 0) >= i + 1 ? "#1F5E5B" : "#DCE3E1" }}
              transition={{ duration: 0.25 }}
            />
          ))}
        </div>
      )}
    </header>
  );
}
