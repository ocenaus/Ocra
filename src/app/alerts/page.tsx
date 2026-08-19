import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotConfiguredPanel } from "@/components/orca/not-configured";
import { createClient } from "@/lib/supabase/server";
import { clientEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Alerts",
  description: "Server-side alert rules for wallets, tokens and risk changes.",
};

export default async function AlertsPage() {
  if (!clientEnv.NEXT_PUBLIC_SUPABASE_URL || !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-semibold text-foreground">Data provider is not configured.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Alerts require Supabase to be configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: alerts } = await supabase
    .from("alerts")
    .select("id, alert_type, is_active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">Alerts</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Alert rules are processed server-side — they fire even when your browser is closed.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-muted-foreground uppercase">
            <Bell className="size-4 text-primary" />
            Your alert rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts && alerts.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {alerts.map((alert) => (
                <li key={alert.id} className="flex items-center justify-between py-3">
                  <span className="text-sm text-foreground">{alert.alert_type.replaceAll("_", " ")}</span>
                  <span className="text-xs text-muted-foreground uppercase">
                    {alert.is_active ? "Active" : "Paused"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <NotConfiguredPanel
              title="You have no alert rules yet."
              description="Creating alerts (large transfers, risk-score changes, wallet↔token interactions) ships once whale detection and risk scoring are connected to real blockchain data."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
