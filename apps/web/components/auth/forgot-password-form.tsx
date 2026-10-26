"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { emailOnlySchema } from "@marshaldesk/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthHeading } from "@/components/auth/auth-heading";
import { authCall, authErrorMessage } from "@/components/auth/auth-error";
import { FormAlert } from "@/components/auth/form-alert";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { resetPasswordHref } from "@/lib/auth/routes";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setServerError(null);
    const { error } = await authCall(
      authClient.forgetPassword.emailOtp({ email }),
    );
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    router.push(resetPasswordHref(email));
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <AuthHeading
          title="Reset your password"
          description="Enter your email and we'll send you a 6-digit code."
        />
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            variant="ink"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <FormAlert>{serverError}</FormAlert>
        <Field>
          <SubmitButton pending={isSubmitting}>Send code</SubmitButton>
          <FieldDescription className="text-center">
            Remembered it? <Link href="/auth/sign-in">Sign in</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
