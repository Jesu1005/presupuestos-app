"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "success";
type Size = "sm" | "md";

const VARIANTES: Record<Variant, string> = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-500",
  secondary:
    "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
  danger: "bg-red-600 text-white hover:bg-red-500",
  success: "bg-green-600 text-white hover:bg-green-500",
};

const TAMANIOS: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
};

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  href?: string;
} & Omit<ComponentProps<"button">, "className" | "children"> &
  Omit<ComponentProps<typeof Link>, "className" | "children" | "href">;

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  href,
  children,
  ...rest
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${VARIANTES[variant]} ${TAMANIOS[size]} ${className}`;

  if (href !== undefined) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}