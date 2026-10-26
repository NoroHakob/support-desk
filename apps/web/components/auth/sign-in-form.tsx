"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema } from "@marshaldesk/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthHeading } from "@/components/auth/auth-heading";
import {
  authCall,
  authErrorMessage,
  isEmailNotVerified,
} from "@/components/auth/auth-error";
import { FormAlert } from "@/components/auth/form-alert";
import {
  GOOGLE_SIGN_IN_ENABLED,
  GoogleButton,
} from "@/components/auth/google-button";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
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

export function SignInForm({ notice }: { notice?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setServerError(null);
    const { error } = await authCall(
      authClient.signIn.email({ email, password }),
    );
    if (!error) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    if (isEmailNotVerified(error)) {
      await authCall(
        authClient.emailOtp.sendVerificationOtp({
          email,
          type: "email-verification",
        }),
      );
      router.push(verifyEmailHref(email));
      return;
    }
    setServerError(authErrorMessage(error));
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <AuthHeading
          title="Welcome back"
          description="Sign in to your SupportDesk account."
        />
        <FormAlert tone="notice">{notice}</FormAlert>
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
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/auth/forgot-password"
              className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Your password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <FormAlert>{serverError}</FormAlert>
        <Field>
          <SubmitButton pending={isSubmitting}>Sign in</SubmitButton>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          {GOOGLE_SIGN_IN_ENABLED ? (
            <GoogleButton onError={setServerError} />
          ) : null}
          <Button
            variant="form-secondary"
            size="field"
            className="w-full"
            nativeButton={false}
            render={<Link href="/auth/sign-in/code" />}
          >
            Email me a sign-in code
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up">Sign up</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
