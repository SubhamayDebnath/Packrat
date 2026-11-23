"use client";

import { useEffect, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { Toaster } from "@/components/ui/sonner";
import { useThemeStore } from "@/stores/theme";

export function Providers({ children }: { children: ReactNode }) {
  const init = useThemeStore((s) => s.init);
  useEffect(() => init(), [init]);

  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster
        position="bottom-center"
        offset={{ bottom: 88 }}
        mobileOffset={{ bottom: 88 }}
      />
    </MotionConfig>
  );
}
