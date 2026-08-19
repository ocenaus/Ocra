import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { signIn } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Sign in — ORCA",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-1 text-center text-lg font-semibold text-foreground">Sign in to ORCA</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">Track the Ocean.</p>
      <AuthForm mode="login" action={signIn} />
    </>
  );
}
