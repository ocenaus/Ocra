import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { signUp } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Create account — ORCA",
};

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-1 text-center text-lg font-semibold text-foreground">Create your ORCA account</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Scan public wallets and tokens — no wallet connection required.
      </p>
      <AuthForm mode="signup" action={signUp} />
    </>
  );
}
