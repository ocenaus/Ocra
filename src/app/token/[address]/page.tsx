import type { Metadata } from "next";
import { AlertTriangle, Coins, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotConfiguredPanel } from "@/components/orca/not-configured";
import { isValidEthereumAddress } from "@/lib/validation/ethereum";

type Props = { params: Promise<{ address: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  return {
    title: `Token ${address}`,
    description: `ORCA token scanner and risk analysis for ${address}.`,
  };
}

export default async function TokenScannerPage({ params }: Props) {
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <Coins className="size-6 text-primary" />
        <h1 className="font-mono text-lg font-semibold text-foreground break-all">{address}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm tracking-widest text-muted-foreground uppercase">
            Token Scanner &amp; ORCA Risk Score
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <NotConfiguredPanel
            title="Data provider is not configured."
            description="Token metadata, price, liquidity, holders and contract risk analysis require Alchemy, Moralis and/or Etherscan. The Token Scanner and ORCA Risk Score are implemented in later phases — ORCA never labels a token safe or shows fabricated metrics."
          />
          <Button variant="outline" asChild className="self-center">
            <a href={`https://etherscan.io/address/${address}`} target="_blank" rel="noreferrer noopener">
              View on Etherscan <ExternalLink className="size-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
