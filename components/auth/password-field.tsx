"use client";

import { useState } from "react";
import { Dices, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { randomPassword } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentProps<typeof Input>, "type" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  /** Adds a button that fills the field with a strong random password and reveals it. */
  generate?: boolean;
};

export function PasswordField({ value, onChange, generate, className, ...props }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(generate ? "pr-16" : "pr-9", className)}
      />
      <div className="absolute inset-y-0 right-1.5 flex items-center gap-0.5">
        {generate && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Generate a random password"
            title="Generate a random password"
            onClick={() => {
              onChange(randomPassword());
              setShow(true);
            }}
          >
            <Dices />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((v) => !v)}
        >
          {show ? <EyeOff /> : <Eye />}
        </Button>
      </div>
    </div>
  );
}
