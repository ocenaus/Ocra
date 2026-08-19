import type { Metadata } from "next";
import { AlertTriangle, ExternalLink, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotConfiguredPanel } from "@/components/orca/not-configured";
import { isValidEnsName, isValidEthereumAddress } from "@/lib/validation/ethereum";

type Props = { params: Promise<{ address: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  return {
    title: `Wallet ${address}`,
    description: `ORCA wallet intelligence for ${address}.`,
  };
}

export default async function WalletScannerPage({ params }: Props) {
  const { address: raw } = await params;
  const address = decodeURIComponent(raw);
  const isAddress = isValidEthereumAddress(address);
  const isEns = isValidEnsName(address);

  if (!isAddress && !isEns) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <AlertTriangle className="mx-auto mb-4 size-8 text-destructive" />
        <h1 className="text-xl font-semibold text-foreground">Invalid Ethereum address.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          &ldquo;{address}&rdquo; is not a valid Ethereum address or ENS name.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <Wallet className="size-6 text-primary" />
        <div>
          <h1 className="font-mono text-lg font-semibold text-foreground break-all">{address}</h1>
          {isEns && <p className="text-xs text-muted-foreground">ENS name — resolution requires a data provider.</p>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm tracking-widest text-muted-foreground uppercase">
            Wallet Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <NotConfiguredPanel
            title="Data provider is not configured."
            description="ETH balance, token holdings, NFTs, portfolio value and transaction history require Alchemy and/or Moralis. The Wallet Scanner is implemented in a later phase — ORCA never shows placeholder balances or fabricated transactions."
          />
          {isAddress && (
            <Button variant="outline" asChild className="self-center">
              <a href={`https://etherscan.io/address/${address}`} target="_blank" rel="noreferrer noopener">
                View on Etherscan <ExternalLink className="size-4" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
