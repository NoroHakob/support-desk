import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { auth } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: PageProps<"/auth/sign-in">) {
  const { data: session } = await auth.getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const notice = params.reset
    ? "Your password is updated. Sign in with your new password."
    : params.verified
      ? "Your email is verified. Sign in to continue."
      : undefined;

  return <SignInForm notice={notice} />;
}
