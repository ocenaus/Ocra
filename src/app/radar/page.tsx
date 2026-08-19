import type { Metadata } from "next";
import { Fuel, Gauge, TrendingUp, Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrcaSearchBar } from "@/components/orca/search-bar";
import { NotConfiguredPanel } from "@/components/orca/not-configured";
import { getProviderStatus } from "@/lib/env";

export const metadata: Metadata = {
  title: "ORCA Radar",
  description: "On-chain intelligence dashboard — market overview and live ORCA feed.",
};

const MARKET_STATS = [
  { label: "ETH Price", icon: TrendingUp },
  { label: "ETH 24h Change", icon: Gauge },
  { label: "Gas Price", icon: Fuel },
  { label: "Network Activity", icon: Waves },
];

export default function RadarPage() {
  const providers = getProviderStatus();
  const dataProvidersReady = providers.alchemy || providers.moralis;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-1">
        <p className="text-sm font-medium tracking-widest text-primary uppercase">ORCA</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">On-Chain Intelligence</h1>
      </div>

      <OrcaSearchBar className="mb-10" />

      <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {MARKET_STATS.map(({ label, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="flex items-center gap-2 text-xs tracking-wide text-muted-foreground uppercase">
                <Icon className="size-3.5" />
                {label}
              </span>
              <span className="text-lg font-semibold text-muted-foreground">
                {dataProvidersReady ? "—" : "Not configured"}
              </span>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm tracking-widest text-muted-foreground uppercase">
            Live ORCA Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dataProvidersReady ? (
            <NotConfiguredPanel
              title="No significant activity detected."
              description="Whale transfers, unusual volume and contract risk events will stream here in real time."
            />
          ) : (
            <NotConfiguredPanel
              title="Data provider is not configured."
              description="The Live ORCA Feed requires Alchemy and/or Moralis to stream real Ethereum Mainnet activity. This is implemented in Phase 2 (data providers) and Phase 6 (ORCA Radar) — no synthetic activity is shown in the meantime."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
