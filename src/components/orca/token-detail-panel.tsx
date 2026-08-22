import { AlertTriangle, CheckCircle2, FileCode2, HelpCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XpWindow } from "@/components/xp/xp-window";
import { MascotSlot } from "@/components/orca/mascot-slot";
import { QuickLinks } from "@/components/orca/quick-links";
import { SocialLinks } from "@/components/orca/social-links";
import type { TokenDetails } from "@/lib/services/types";
import { formatUsd, shortenAddress } from "@/lib/format";

function TriStateBadge({ label, value }: { label: string; value: boolean | null }) {
  if (value === null) {
    return (
      <Badge variant="outline" className="gap-1.5">
        <HelpCircle className="size-3" /> {label}: unknown
      </Badge>
    );
  }
  return (
    <Badge variant={value ? "warning" : "success"} className="gap-1.5">
      {value ? <AlertTriangle className="size-3" /> : <CheckCircle2 className="size-3" />}
      {label}: {value ? "yes" : "no"}
    </Badge>
  );
}

export function TokenDetailPanel({
  details,
  totalHoldersShown,
}: {
  details: TokenDetails;
  totalHoldersShown: number | null;
}) {
  const { metadata, price, contract } = details;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          {metadata.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external token logo, arbitrary host
            <img src={metadata.logoUrl} alt="" className="size-10 rounded-full" />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-muted-foreground">
              {metadata.symbol?.slice(0, 2) ?? "?"}
            </div>
          )}
          <div>
            <CardTitle>{metadata.name ?? "Data unavailable"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {metadata.symbol ?? "—"} · <span className="font-mono">{shortenAddress(details.address)}</span>
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Price" value={formatUsd(price.usdPrice)} />
            <Stat label="Market cap (est.)" value={formatUsd(details.marketCapUsd)} />
            <Stat
              label="Top holders shown"
              value={totalHoldersShown !== null ? String(totalHoldersShown) : "Data unavailable"}
            />
          </div>
          <QuickLinks address={details.address} />
          <SocialLinks socials={details.socials} />
        </CardContent>
      </Card>

      <XpWindow title="Contract Analysis" icon={<FileCode2 className="size-4 text-white" aria-hidden="true" />}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {contract.isVerified === null ? (
                <Badge variant="outline" className="gap-1.5">
                  <HelpCircle className="size-3" /> Verification unknown
                </Badge>
              ) : contract.isVerified ? (
                <Badge variant="success" className="gap-1.5">
                  <CheckCircle2 className="size-3" /> Contract verified
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1.5">
                  <XCircle className="size-3" /> Contract not verified
                </Badge>
              )}
              {contract.isProxy && <Badge variant="warning">Upgradeable proxy</Badge>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">Owner</p>
                <p className="font-mono text-sm text-foreground">
                  {contract.isOwnershipRenounced
                    ? "Renounced"
                    : contract.ownerAddress
                      ? shortenAddress(contract.ownerAddress)
                      : "Data unavailable"}
                </p>
              </div>
              {contract.implementationAddress && (
                <div>
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">Implementation</p>
                  <p className="font-mono text-sm text-foreground">
                    {shortenAddress(contract.implementationAddress)}
                  </p>
                </div>
              )}
              {contract.creatorAddress && (
                <div>
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">Contract creator</p>
                  <p className="font-mono text-sm text-foreground">{shortenAddress(contract.creatorAddress)}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <TriStateBadge label="Mint" value={contract.hasMintFunction} />
              <TriStateBadge label="Burn" value={contract.hasBurnFunction} />
              <TriStateBadge label="Pause" value={contract.hasPauseFunction} />
              <TriStateBadge label="Blacklist" value={contract.hasBlacklistFunction} />
            </div>
          </div>

          <MascotSlot label="Mascot artwork pending" tone="dark" className="hidden h-32 w-24 shrink-0 sm:flex" />
        </div>
      </XpWindow>

      {details.dataGaps.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            {details.dataGaps.map((gap) => (
              <p key={gap} className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                {gap}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Contract capability flags are derived from a text scan of verified source code and are an
        analytical signal, not a guarantee — always verify independently before trusting a contract.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-semibold text-foreground break-words">{value}</p>
    </div>
  );
}
