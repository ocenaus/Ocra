export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function formatUsd(value: number | null): string {
  if (value === null) return "Data unavailable";
  if (value < 0.01 && value > 0) return "<$0.01";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

export function formatPercentage(value: number | null): string {
  if (value === null) return "—";
  if (value < 0.01) return "<0.01%";
  return `${value.toFixed(2)}%`;
}

/** Signed percentage change (e.g. "+4.21%" / "-1.03%"), for price-change figures rather than supply shares. */
export function formatPriceChangePercent(value: number | null): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatCompactNumber(value: number | null): string {
  if (value === null) return "Data unavailable";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}
