"use client";

import { CODE_LENGTH } from "@marshaldesk/shared";
import { REGEXP_ONLY_DIGITS } from "input-otp";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export function CodeInput({
  id,
  value,
  onChange,
  onBlur,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  invalid: boolean;
}) {
  return (
    <InputOTP
      id={id}
      maxLength={CODE_LENGTH}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      aria-invalid={invalid}
      containerClassName="justify-center gap-3"
    >
      <InputOTPGroup className="gap-2">
        {[0, 1, 2].map((index) => (
          <InputOTPSlot
            key={index}
            index={index}
            variant="ink"
            aria-invalid={invalid}
          />
        ))}
      </InputOTPGroup>
      <InputOTPGroup className="gap-2">
        {[3, 4, 5].map((index) => (
          <InputOTPSlot
            key={index}
            index={index}
            variant="ink"
            aria-invalid={invalid}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
