import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium font-sans transition-shadow disabled:opacity-40 disabled:cursor-not-allowed select-none";

const variants = {
  primary: "bg-primary text-white shadow-soft hover:shadow-card",
  outline: "bg-transparent border-[1.5px] border-primary text-primary-dark hover:bg-primary-soft",
  ghost: "bg-transparent text-muted hover:text-primary-dark",
};

const sizes = {
  md: "text-[15px] px-5 py-3",
  lg: "text-base px-6 py-4",
};

interface CommonProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };
type ButtonAsAnchor = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a" };

export default function Button(props: ButtonAsButton | ButtonAsAnchor) {
  const { variant = "primary", size = "md", fullWidth, className, children, ...rest } = props;
  const classes = clsx(base, variants[variant], sizes[size], fullWidth && "w-full", className);
  const MotionComp = props.as === "a" ? motion.a : motion.button;

  return (
    <MotionComp
      className={classes}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
      {...(rest as any)}
    >
      {children}
    </MotionComp>
  );
}
