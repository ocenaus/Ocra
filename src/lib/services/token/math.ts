import { scaleSqrt } from "d3-scale";

/**
 * Pure numeric helpers for token math and bubble sizing. Kept separate from
 * the provider orchestrator so they're trivially unit-testable without
 * mocking network calls.
 */

/** Converts a base-unit integer string (e.g. wei-like) to a decimal number. Precision-safe via BigInt. */
export function rawToDecimal(raw: string, decimals: number): number | null {
  if (!/^\d+$/.test(raw) || decimals < 0) return null;
  try {
    const value = BigInt(raw);
    const divisor = BigInt(10) ** BigInt(decimals);
    // BigInt division truncates; recover fractional precision via string math
    // for reasonable token supplies (safe well beyond realistic supply sizes).
    const whole = value / divisor;
    const remainder = value % divisor;
    const fraction = remainder.toString().padStart(decimals, "0").slice(0, 6);
    const combined = `${whole}.${fraction || "0"}`;
    const result = Number(combined);
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/** price * total supply, in USD. Null if either input is unavailable. */
export function computeMarketCapUsd(
  usdPrice: number | null,
  totalSupplyRaw: string | null,
  decimals: number | null,
): number | null {
  if (usdPrice === null || totalSupplyRaw === null || decimals === null) return null;
  const supply = rawToDecimal(totalSupplyRaw, decimals);
  if (supply === null) return null;
  const marketCap = usdPrice * supply;
  return Number.isFinite(marketCap) ? marketCap : null;
}

/** Computes a holder's % of total supply when the provider didn't supply one directly. */
export function computePercentageOfSupply(
  balanceRaw: string,
  totalSupplyRaw: string,
  decimals: number,
): number | null {
  if (!/^\d+$/.test(balanceRaw) || !/^\d+$/.test(totalSupplyRaw)) return null;
  try {
    const balance = BigInt(balanceRaw);
    const supply = BigInt(totalSupplyRaw);
    if (supply === BigInt(0)) return null;
    // Scale up before dividing to preserve precision, then convert to a percentage.
    const scaled = (balance * BigInt(1_000_000_00)) / supply;
    return Number(scaled) / 1_000_000;
  } catch {
    void decimals;
    return null;
  }
}

/**
 * Concentration thresholds used to label the holder insights section as a
 * warning. These are an analytical heuristic ORCA chose, not a market
 * standard or a guarantee of risk — the UI must say so explicitly.
 */
export const CONCENTRATION_THRESHOLDS = {
  topHolderPct: 30,
  top10Pct: 50,
} as const;

export interface HolderConcentration {
  topHolderPct: number | null;
  top10Pct: number | null;
  topHolderExceedsThreshold: boolean;
  top10ExceedsThreshold: boolean;
}

/**
 * Summarizes concentration among the given holders (expected to already be
 * sorted descending by balance, as every provider we use returns them).
 * `top10Pct` is only computed when every one of the top 10 has a known
 * percentage — a partial sum would understate concentration and could read
 * as reassuring when it isn't.
 */
export function computeHolderConcentration(
  holders: Array<{ percentageOfSupply: number | null }>,
): HolderConcentration {
  const topHolderPct = holders[0]?.percentageOfSupply ?? null;

  const top10 = holders.slice(0, 10);
  const top10HasCompleteData = top10.length > 0 && top10.every((h) => h.percentageOfSupply !== null);
  const top10Pct = top10HasCompleteData
    ? top10.reduce((sum, h) => sum + (h.percentageOfSupply ?? 0), 0)
    : null;

  return {
    topHolderPct,
    top10Pct,
    topHolderExceedsThreshold: topHolderPct !== null && topHolderPct > CONCENTRATION_THRESHOLDS.topHolderPct,
    top10ExceedsThreshold: top10Pct !== null && top10Pct > CONCENTRATION_THRESHOLDS.top10Pct,
  };
}

const MIN_BUBBLE_RADIUS = 6;
const MAX_BUBBLE_RADIUS = 90;

/**
 * Maps holder percentages to bubble radii using a sqrt scale, so *area*
 * (not radius) is proportional to % of supply — the correct way to encode
 * magnitude in a bubble chart. Holders with an unknown percentage get the
 * minimum radius rather than being silently dropped.
 */
export function computeBubbleRadii(
  percentages: Array<number | null>,
  { minRadius = MIN_BUBBLE_RADIUS, maxRadius = MAX_BUBBLE_RADIUS } = {},
): number[] {
  const known = percentages.filter((p): p is number => p !== null && p > 0);
  const max = known.length > 0 ? Math.max(...known) : 1;

  const scale = scaleSqrt().domain([0, max]).range([minRadius, maxRadius]).clamp(true);

  return percentages.map((p) => (p === null ? minRadius : scale(p)));
}
