import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { emailParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/auth/reset-password">) {
  const email = emailParam((await searchParams).email);
  if (!email) {
    redirect("/auth/forgot-password");
  }

  return <ResetPasswordForm email={email} />;
}
