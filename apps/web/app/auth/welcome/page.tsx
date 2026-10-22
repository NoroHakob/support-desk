import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WelcomeForm } from "@/components/auth/welcome-form";
import { auth } from "@/lib/auth/server";
import { verifyEmailHref } from "@/lib/auth/routes";
import { client } from "@/lib/orpc";
import { firstName } from "@/lib/user";

export const metadata: Metadata = { title: "Welcome" };
export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }
  if (!session.user.emailVerified) {
    redirect(verifyEmailHref(session.user.email));
  }
  if (await client.workspace.current()) {
    redirect("/dashboard");
  }

  return <WelcomeForm firstName={firstName(session.user.name)} />;
}
