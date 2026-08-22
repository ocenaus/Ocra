import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { clientEnv, getProviderStatus } from "@/lib/env";

export const metadata: Metadata = {
  title: "Diagnostics",
  robots: { index: false, follow: false },
};

async function checkDatabase(): Promise<{ ok: boolean; detail: string }> {
  try {
    const supabase = await createClient();
    const startedAt = Date.now();
    const { error } = await supabase.from("users").select("id", { count: "exact", head: true });
    if (error) return { ok: false, detail: error.message };
    return { ok: true, detail: `Responded in ${Date.now() - startedAt}ms` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Unknown error" };
  }
}

export default async function DiagnosticsPage() {
  const providers = getProviderStatus();
  const supabaseConfigured = Boolean(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL && clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  // Without Supabase configured there is no auth system to gate on yet —
  // this is only reachable during initial local setup. Once Supabase is
  // configured, this page requires a signed-in admin.
  if (supabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login?next=/admin/diagnostics");

    const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) redirect("/");
  }

  const db = supabaseConfigured
    ? await checkDatabase()
    : { ok: false, detail: "Supabase is not configured" };

  const rows = [
    { label: "Supabase (auth + database)", ok: providers.supabase, detail: providers.supabase ? "Configured" : "Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY" },
    { label: "Database connection", ok: db.ok, detail: db.detail },
    { label: "Alchemy", ok: providers.alchemy, detail: providers.alchemy ? "Configured" : "Missing ALCHEMY_API_KEY — required for Phase 2" },
    { label: "Moralis", ok: providers.moralis, detail: providers.moralis ? "Configured" : "Missing MORALIS_API_KEY — required for Phase 2" },
    { label: "Etherscan", ok: providers.etherscan, detail: providers.etherscan ? "Configured" : "Missing ETHERSCAN_API_KEY — optional" },
    { label: "Telegram alerts", ok: providers.telegram, detail: providers.telegram ? "Configured" : "Missing TELEGRAM_BOT_TOKEN — required for Phase 11" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">ORCA Diagnostics</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Live configuration status. API keys are never displayed here — only whether each is set.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm tracking-widest text-muted-foreground uppercase">System status</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y divide-border">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  {row.ok ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  ) : (
                    <XCircle className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-sm text-foreground">{row.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-right text-xs text-muted-foreground">{row.detail}</span>
                  <Badge variant={row.ok ? "success" : "outline"}>{row.ok ? "OK" : "Not configured"}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
