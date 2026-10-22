"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createWorkspaceInputSchema } from "@marshaldesk/shared";
import { ORPCError } from "@orpc/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthHeading } from "@/components/auth/auth-heading";
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
import { orpc } from "@/lib/orpc";

export function WelcomeForm({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const createWorkspace = useMutation(orpc.workspace.create.mutationOptions());
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createWorkspaceInputSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = handleSubmit(async (input) => {
    setServerError(null);
    try {
      await createWorkspace.mutateAsync(input);
    } catch (error) {
      if (!(error instanceof ORPCError && error.code === "CONFLICT")) {
        setServerError("We couldn't create your workspace. Try again.");
        return;
      }
    }
    router.replace("/dashboard");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <AuthHeading
          title={firstName ? `Welcome, ${firstName}` : "Welcome"}
          description="One last step before your dashboard."
        />
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">
            What&apos;s your business called?
          </FieldLabel>
          <Input
            id="name"
            variant="ink"
            autoComplete="organization"
            autoFocus
            placeholder="Acme Inc."
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
          <FieldDescription>
            This becomes your workspace name. You can change it later in
            settings.
          </FieldDescription>
        </Field>
        <FormAlert>{serverError}</FormAlert>
        <Field>
          <SubmitButton pending={isSubmitting}>Continue</SubmitButton>
        </Field>
      </FieldGroup>
    </form>
  );
}
