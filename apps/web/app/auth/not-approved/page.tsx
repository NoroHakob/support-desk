import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotApproved } from "@/components/auth/not-approved";
import { isApprovedOwner } from "@/lib/auth/owners";
import { auth } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Not approved" };
export const dynamic = "force-dynamic";

export default async function NotApprovedPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }
  if (isApprovedOwner(session.user.email)) {
    redirect("/dashboard");
  }

  return <NotApproved email={session.user.email} />;
}
