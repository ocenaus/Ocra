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
