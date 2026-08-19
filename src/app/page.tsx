import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrcaSearchBar } from "@/components/orca/search-bar";
import { NotConfiguredPanel } from "@/components/orca/not-configured";
import { getProviderStatus } from "@/lib/env";

export default function HomePage() {
  const providers = getProviderStatus();
  const dataProvidersReady = providers.alchemy || providers.moralis;

  return (
    <div className="ocean-depth">
      <section className="mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center sm:py-32">
        <p className="mb-4 text-sm font-medium tracking-widest text-primary uppercase">
          ORCA · Powered by Oceanus
        </p>
        <h1 className="text-glow text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
          Track the Ocean.
        </h1>
        <p className="mt-5 max-w-xl text-balance text-muted-foreground sm:text-lg">
          Real-time crypto intelligence for wallets, tokens and on-chain activity.
        </p>

        <OrcaSearchBar className="mt-10 w-full max-w-2xl" />

        <Button variant="outline" size="lg" className="mt-4" asChild>
          <Link href="/radar">Explore ORCA</Link>
        </Button>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-24">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-muted-foreground uppercase">
              <Activity className="size-4 text-primary" />
              Live Ocean Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataProvidersReady ? (
              <NotConfiguredPanel
                title="No significant activity detected."
                description="ORCA is watching Ethereum Mainnet — whale transfers, unusual volume and contract risk will appear here as they're detected."
              />
            ) : (
              <NotConfiguredPanel
                title="Data provider is not configured."
                description="Live on-chain activity requires an Ethereum data provider (Alchemy or Moralis). This ships in Phase 2 of the build — no activity is shown until it's connected to real blockchain data."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
