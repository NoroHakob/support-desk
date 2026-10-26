"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { codeOnlySchema } from "@marshaldesk/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AuthHeading } from "@/components/auth/auth-heading";
import { authCall, authErrorMessage } from "@/components/auth/auth-error";
import { CodeInput } from "@/components/auth/code-input";
import { FormAlert } from "@/components/auth/form-alert";
import { ResendCode } from "@/components/auth/resend-code";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { authClient } from "@/lib/auth/client";

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(codeOnlySchema),
    defaultValues: { code: "" },
  });

  const onSubmit = handleSubmit(async ({ code }) => {
    setServerError(null);
    const { data, error } = await authCall(
      authClient.emailOtp.verifyEmail({ email, otp: code }),
    );
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    if (!data.token) {
      router.replace("/auth/sign-in?verified=1");
      return;
    }
    router.replace("/auth/welcome");
    router.refresh();
  });

  async function resend() {
    const { error } = await authCall(
      authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      }),
    );
    return error ? authErrorMessage(error) : null;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <AuthHeading
          title="Check your email"
          description={
            <>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </>
          }
        />
        <Field data-invalid={!!errors.code}>
          <FieldLabel htmlFor="code" className="sr-only">
            Verification code
          </FieldLabel>
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <CodeInput
                id="code"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={!!errors.code}
              />
            )}
          />
          <FieldError errors={[errors.code]} className="text-center" />
        </Field>
        <FormAlert>{serverError}</FormAlert>
        <Field>
          <SubmitButton pending={isSubmitting}>Verify email</SubmitButton>
          <ResendCode onResend={resend} />
          <FieldDescription className="text-center">
            Wrong email? <Link href="/auth/sign-up">Start again</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
