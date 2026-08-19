import type { Metadata } from "next";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotConfiguredPanel } from "@/components/orca/not-configured";
import { createClient } from "@/lib/supabase/server";
import { clientEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Wallets and tokens you're tracking with ORCA.",
};

export default async function WatchlistPage() {
  if (!clientEnv.NEXT_PUBLIC_SUPABASE_URL || !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-semibold text-foreground">Data provider is not configured.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The Watchlist requires Supabase to be configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route is protected by middleware, but guard defensively.
  if (!user) return null;

  const { data: items } = await supabase
    .from("watchlists")
    .select("id, item_type, nickname, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">Watchlist</h1>
      <p className="mb-8 text-sm text-muted-foreground">Track wallets and tokens for activity and risk changes.</p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-muted-foreground uppercase">
            <Star className="size-4 text-primary" />
            Tracked items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items && items.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-3">
                  <span className="text-sm text-foreground">{item.nickname ?? item.item_type}</span>
                  <span className="text-xs text-muted-foreground uppercase">{item.item_type}</span>
                </li>
              ))}
            </ul>
          ) : (
            <NotConfiguredPanel
              title="Your watchlist is empty."
              description="Adding wallets and tokens to your watchlist ships in a later phase, once the Wallet and Token Scanners are connected to real blockchain data."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
