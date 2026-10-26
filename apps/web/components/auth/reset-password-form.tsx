"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PASSWORD_MIN_LENGTH, resetPasswordSchema } from "@marshaldesk/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AuthHeading } from "@/components/auth/auth-heading";
import { authCall, authErrorMessage } from "@/components/auth/auth-error";
import { CodeInput } from "@/components/auth/code-input";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
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

export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ code, password }) => {
    setServerError(null);
    const { error } = await authCall(
      authClient.emailOtp.resetPassword({ email, otp: code, password }),
    );
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    router.replace("/auth/sign-in?reset=1");
  });

  async function resend() {
    const { error } = await authCall(
      authClient.forgetPassword.emailOtp({ email }),
    );
    return error ? authErrorMessage(error) : null;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <AuthHeading
          title="Choose a new password"
          description={
            <>
              Enter the code we sent to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </>
          }
        />
        <Field data-invalid={!!errors.code}>
          <FieldLabel htmlFor="code">Code</FieldLabel>
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
          <FieldError errors={[errors.code]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <FormAlert>{serverError}</FormAlert>
        <Field>
          <SubmitButton pending={isSubmitting}>Update password</SubmitButton>
          <ResendCode onResend={resend} />
          <FieldDescription className="text-center">
            <Link href="/auth/sign-in">Back to sign in</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
