import type { Metadata } from "next";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotConfiguredPanel } from "@/components/orca/not-configured";
import { BubbleMap } from "@/components/orca/bubble-map";
import { TokenDetailPanel } from "@/components/orca/token-detail-panel";
import { isValidEthereumAddress, normalizeAddress } from "@/lib/validation/ethereum";
import { getTokenDetails, getTokenHolders } from "@/lib/services/token";

type Props = { params: Promise<{ address: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  return {
    title: `Bubble Map — ${address}`,
    description: `ORCA holder bubble map and contract analysis for ${address}.`,
  };
}

export default async function TokenBubbleMapPage({ params }: Props) {
  const { address: raw } = await params;
  const address = decodeURIComponent(raw);

  if (!isValidEthereumAddress(address)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <AlertTriangle className="mx-auto mb-4 size-8 text-destructive" />
        <h1 className="text-xl font-semibold text-foreground">Invalid Ethereum address.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          &ldquo;{address}&rdquo; is not a valid Ethereum contract address.
        </p>
      </div>
    );
  }

  const normalized = normalizeAddress(address);
  const details = await getTokenDetails(normalized);
  const { holders, gaps: holderGaps } = await getTokenHolders(
    normalized,
    details.metadata.totalSupplyRaw,
    details.metadata.decimals,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-3">
        <h1 className="font-mono text-lg font-semibold text-foreground break-all">{normalized}</h1>
        <Button variant="outline" size="sm" asChild>
          <a href={`https://etherscan.io/address/${normalized}`} target="_blank" rel="noreferrer noopener">
            Etherscan <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm tracking-widest text-muted-foreground uppercase">
              Holder Bubble Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            {holders.length > 0 ? (
              <BubbleMap holders={holders} symbol={details.metadata.symbol} />
            ) : (
              <NotConfiguredPanel
                title={holderGaps[0] ?? "No holder data available."}
                description="ORCA never shows placeholder or fabricated holder positions — this panel stays empty until real data is available."
              />
            )}
          </CardContent>
        </Card>

        <TokenDetailPanel details={details} totalHoldersShown={holders.length > 0 ? holders.length : null} />
      </div>
    </div>
  );
}
