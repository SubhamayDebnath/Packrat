"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Logo } from "@/components/layout/logo";
import { APP_NAME } from "@/lib/constants";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        <div className="mb-8 flex items-center gap-1">
          <Logo />
          <span className="font-semibold">{APP_NAME}</span>
        </div>
        <div className="grid gap-1">
          <h1 className="text-base font-semibold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-center text-muted-foreground">{footer}</div>}
      </motion.div>
    </main>
  );
}
