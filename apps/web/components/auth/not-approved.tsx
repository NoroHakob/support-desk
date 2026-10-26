"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthHeading } from "@/components/auth/auth-heading";
import { SubmitButton } from "@/components/auth/submit-button";
import { FieldGroup } from "@/components/ui/field";
import { authClient } from "@/lib/auth/client";

export function NotApproved({ email }: { email: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    router.replace("/auth/sign-in");
    router.refresh();
  }

  return (
    <FieldGroup>
      <AuthHeading
        title="This email isn't approved yet"
        description={
          <>
            SupportDesk is invite-only for now, and{" "}
            <span className="font-medium text-foreground">{email}</span>{" "}
            isn&apos;t on the list. Sign out to use a different account.
          </>
        }
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void signOut();
        }}
      >
        <SubmitButton pending={pending}>Sign out</SubmitButton>
      </form>
    </FieldGroup>
  );
}
