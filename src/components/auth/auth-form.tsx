"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthActionState } from "@/app/(auth)/actions";

const initialState: AuthActionState = {};

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "signup";
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          minLength={8}
          autoComplete={isLogin ? "current-password" : "new-password"}
        />
      </div>

      {state.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "New to ORCA? " : "Already have an account? "}
        <Link href={isLogin ? "/signup" : "/login"} className="text-primary hover:underline">
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
