import type { Metadata } from "next";

import { SignInCodeForm } from "@/components/auth/sign-in-code-form";

export const metadata: Metadata = { title: "Sign in with a code" };

export default function SignInCodePage() {
  return <SignInCodeForm />;
}
