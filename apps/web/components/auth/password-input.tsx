"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordInput(
  props: Omit<React.ComponentProps<typeof Input>, "type" | "variant">,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        variant="ink"
        className="pr-12"
      />
      <Button
        type="button"
        variant="form-ghost"
        size="icon"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
        className="absolute top-1/2 right-2 -translate-y-1/2"
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}
