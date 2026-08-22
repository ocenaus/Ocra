import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { computeHolderConcentration, CONCENTRATION_THRESHOLDS } from "@/lib/services/token/math";
import { formatPercentage } from "@/lib/format";
import type { HolderEntry } from "@/lib/services/types";

/**
 * A quick read on concentration among the holders we already fetched.
 * Deliberately labeled as ORCA's own heuristic — the thresholds are a
 * judgment call, not a market standard, and this never claims a token is
 * "safe" or "risky" outright.
 */
export function HolderInsights({ holders }: { holders: HolderEntry[] }) {
  if (holders.length === 0) return null;

  const { topHolderPct, top10Pct, topHolderExceedsThreshold, top10ExceedsThreshold } =
    computeHolderConcentration(holders);
  const hasWarning = topHolderExceedsThreshold || top10ExceedsThreshold;
  const includesContracts = holders.slice(0, 10).some((h) => h.isContract);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm tracking-widest text-muted-foreground uppercase">
          Holder Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
          <span>
            Top holder controls{" "}
            <span className="font-semibold">{formatPercentage(topHolderPct)}</span> of supply.
          </span>
          {topHolderExceedsThreshold && (
            <Badge variant="warning" className="gap-1.5">
              <AlertTriangle className="size-3" /> Above {CONCENTRATION_THRESHOLDS.topHolderPct}%
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
          <span>
            Top 10 holders control{" "}
            <span className="font-semibold">{formatPercentage(top10Pct)}</span> of supply.
          </span>
          {top10ExceedsThreshold && (
            <Badge variant="warning" className="gap-1.5">
              <AlertTriangle className="size-3" /> Above {CONCENTRATION_THRESHOLDS.top10Pct}%
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {hasWarning
            ? "This is ORCA's analytical heuristic for holder concentration, not a guarantee of risk or safety — always verify independently."
            : "Concentration is below ORCA's analytical thresholds — this is a heuristic, not a guarantee of safety."}
          {includesContracts && " Figures include contract addresses (e.g. liquidity pools) among the top holders, not only individual wallets."}
        </p>
      </CardContent>
    </Card>
  );
}
