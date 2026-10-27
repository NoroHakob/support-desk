"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PASSWORD_MIN_LENGTH, signUpSchema } from "@marshaldesk/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthHeading } from "@/components/auth/auth-heading";
import { authCall, authErrorMessage } from "@/components/auth/auth-error";
import { FormAlert } from "@/components/auth/form-alert";
import {
  GOOGLE_SIGN_IN_ENABLED,
  GoogleButton,
} from "@/components/auth/google-button";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { verifyEmailHref } from "@/lib/auth/routes";

export function SignUpForm({ inviteOnly }: { inviteOnly: boolean }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setServerError(null);
    const { error } = await authCall(
      authClient.signUp.email({ name, email, password }),
    );
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    await authCall(
      authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      }),
    );
    router.push(verifyEmailHref(email));
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <AuthHeading
          title="Create your account"
          description={
            inviteOnly
              ? "SupportDesk is invite-only for now. Sign up with an approved email."
              : undefined
          }
        />
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            variant="ink"
            autoComplete="name"
            placeholder="Your name"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>
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
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
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
          <SubmitButton pending={isSubmitting}>Create account</SubmitButton>
        </Field>
        {GOOGLE_SIGN_IN_ENABLED ? (
          <FieldSeparator>Or continue with</FieldSeparator>
        ) : null}
        <Field>
          {GOOGLE_SIGN_IN_ENABLED ? (
            <GoogleButton onError={setServerError} />
          ) : null}
          <FieldDescription className="text-center">
            Already have an account? <Link href="/auth/sign-in">Sign in</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
