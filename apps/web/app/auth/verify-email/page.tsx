import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { emailParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/auth/verify-email">) {
  const email = emailParam((await searchParams).email);
  if (!email) {
    redirect("/auth/sign-up");
  }

  return <VerifyEmailForm email={email} />;
}
