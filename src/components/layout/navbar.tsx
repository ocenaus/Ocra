import Link from "next/link";
import { OrcaWordmark } from "@/components/orca/wordmark";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { createClient } from "@/lib/supabase/server";
import { clientEnv } from "@/lib/env";

const NAV_LINKS = [
  { href: "/radar", label: "Radar" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/alerts", label: "Alerts" },
  { href: "/pricing", label: "Pricing" },
];

export async function Navbar() {
  const supabaseConfigured = Boolean(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL && clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  let user: { email?: string | null; id: string } | null = null;
  let isAdmin = false;

  if (supabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    if (user) {
      const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
      isAdmin = profile?.is_admin ?? false;
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <OrcaWordmark size="sm" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu email={user.email ?? ""} isAdmin={isAdmin} />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
