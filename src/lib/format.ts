export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function formatUsd(value: number | null): string {
  if (value === null) return "Data unavailable";
  if (value < 0.01 && value > 0) return "<$0.01";

  // Hand-rolled instead of Intl's notation:"compact": that trims trailing
  // zeros inconsistently between Node's and the browser's ICU build (e.g.
  // "$2.90M" server-side vs "$2.9M" client-side for the same input), which
  // is a real SSR/hydration text mismatch, not a cosmetic wrinkle.
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

export function formatPercentage(value: number | null): string {
  if (value === null) return "—";
  if (value < 0.01) return "<0.01%";
  return `${value.toFixed(2)}%`;
}

export function formatCompactNumber(value: number | null): string {
  if (value === null) return "Data unavailable";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}
