import { TrendingUp } from "lucide-react";
import { XpWindow } from "@/components/xp/xp-window";
import { Stat } from "@/components/orca/stat";
import { formatCompactNumber, formatPriceChangePercent, formatUsd } from "@/lib/format";
import type { CoinGeckoData, PriceChangePercentages } from "@/lib/services/types";
import { cn } from "@/lib/utils";

const TIMEFRAMES: Array<{ key: keyof PriceChangePercentages; label: string }> = [
  { key: "h1", label: "1h" },
  { key: "h24", label: "24h" },
  { key: "d7", label: "7d" },
  { key: "d14", label: "14d" },
  { key: "d30", label: "30d" },
  { key: "y1", label: "1y" },
];

function PriceChangeChip({ label, value }: { label: string; value: number | null }) {
  const tone = value === null ? "text-muted-foreground" : value > 0 ? "text-success" : value < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="flex flex-col items-center gap-0.5 rounded-md border border-border bg-secondary/40 px-2.5 py-1.5">
      <span className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", tone)}>{formatPriceChangePercent(value)}</span>
    </div>
  );
}

/**
 * Multi-timeframe price change + tokenomics, from CoinGecko. Renders
 * nothing when CoinGecko doesn't have this token — no partial/fake figures.
 */
export function MarketData({ coingecko }: { coingecko: CoinGeckoData | null }) {
  if (!coingecko) return null;
  const { priceChange, tokenomics } = coingecko;

  return (
    <XpWindow title="Market Data" icon={<TrendingUp className="size-4 text-white" aria-hidden="true" />}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {TIMEFRAMES.map(({ key, label }) => (
            <PriceChangeChip key={key} label={label} value={priceChange[key]} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Market cap" value={formatUsd(tokenomics.marketCapUsd)} />
          <Stat label="Fully diluted valuation" value={formatUsd(tokenomics.fullyDilutedValuationUsd)} />
          <Stat label="24h volume" value={formatUsd(tokenomics.volume24hUsd)} />
          <Stat label="Circulating supply" value={formatCompactNumber(tokenomics.circulatingSupply)} />
          <Stat label="Total supply" value={formatCompactNumber(tokenomics.totalSupply)} />
          <Stat label="Max supply" value={formatCompactNumber(tokenomics.maxSupply)} />
        </div>
      </div>
    </XpWindow>
  );
}
