"use client";

import Link from "next/link";
import { Rat } from "lucide-react";
import { motion } from "motion/react";
import { APP_NAME } from "@/lib/constants";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={`${APP_NAME} home`}
      className={className}
    >
      <motion.span
        className="flex size-8 items-center justify-center rounded-md text-foreground"
        whileHover={{ rotate: [0, -14, 10, -6, 0], transition: { duration: 0.5 } }}
        whileTap={{ scale: 0.88 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
      >
        <Rat className="size-5" strokeWidth={1.75} />
      </motion.span>
    </Link>
  );
}
