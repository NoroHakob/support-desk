"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { codeOnlySchema, emailOnlySchema } from "@marshaldesk/shared";
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
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

async function sendSignInCode(email: string) {
  const { error } = await authCall(
    authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" }),
  );
  return error ? authErrorMessage(error) : null;
}

export function SignInCodeForm() {
  const [email, setEmail] = useState<string | null>(null);

  return email ? (
    <CodeStep email={email} onChangeEmail={() => setEmail(null)} />
  ) : (
    <EmailStep onSent={setEmail} />
  );
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
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
    const error = await sendSignInCode(email);
    if (error) {
      setServerError(error);
      return;
    }
    onSent(email);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <AuthHeading
          title="Sign in with a code"
          description="We'll email you a 6-digit code. No password needed."
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
          <SubmitButton pending={isSubmitting}>Email me a code</SubmitButton>
          <FieldDescription className="text-center">
            <Link href="/auth/sign-in">Sign in with a password</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}

function CodeStep({
  email,
  onChangeEmail,
}: {
  email: string;
  onChangeEmail: () => void;
}) {
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
    const { error } = await authCall(
      authClient.signIn.emailOtp({ email, otp: code }),
    );
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <AuthHeading
          title="Check your email"
          description={
            <>
              We sent a 6-digit sign-in code to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </>
          }
        />
        <Field data-invalid={!!errors.code}>
          <FieldLabel htmlFor="code" className="sr-only">
            Sign-in code
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
          <SubmitButton pending={isSubmitting}>Sign in</SubmitButton>
          <ResendCode onResend={() => sendSignInCode(email)} />
          <FieldDescription className="text-center">
            Wrong email?{" "}
            <button
              type="button"
              onClick={onChangeEmail}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Use another one
            </button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
