import { describe, expect, it } from "vitest";
import { computeHolderConcentration, CONCENTRATION_THRESHOLDS } from "@/lib/services/token/math";

function holder(percentageOfSupply: number | null) {
  return { percentageOfSupply };
}

describe("computeHolderConcentration", () => {
  it("returns the top holder's percentage and flags it when above threshold", () => {
    const result = computeHolderConcentration([holder(35), holder(5)]);
    expect(result.topHolderPct).toBe(35);
    expect(result.topHolderExceedsThreshold).toBe(true);
  });

  it("does not flag a top holder at or below the threshold", () => {
    const result = computeHolderConcentration([holder(CONCENTRATION_THRESHOLDS.topHolderPct)]);
    expect(result.topHolderExceedsThreshold).toBe(false);
  });

  it("sums exactly the top 10 holders, ignoring the rest", () => {
    const holders = Array.from({ length: 15 }, () => holder(5)); // 15 holders * 5% each
    const result = computeHolderConcentration(holders);
    expect(result.top10Pct).toBeCloseTo(50, 5); // only first 10 counted = 50%
  });

  it("flags top10 concentration above threshold", () => {
    const holders = Array.from({ length: 10 }, () => holder(6)); // 60% total
    const result = computeHolderConcentration(holders);
    expect(result.top10Pct).toBeCloseTo(60, 5);
    expect(result.top10ExceedsThreshold).toBe(true);
  });

  it("returns null for top10Pct when fewer than 10 holders are known but some percentages are missing", () => {
    const holders = [holder(10), holder(null), holder(5)];
    const result = computeHolderConcentration(holders);
    expect(result.top10Pct).toBeNull();
    expect(result.top10ExceedsThreshold).toBe(false);
  });

  it("computes top10 correctly with fewer than 10 holders when all are known", () => {
    const holders = [holder(20), holder(15), holder(10)];
    const result = computeHolderConcentration(holders);
    expect(result.top10Pct).toBeCloseTo(45, 5);
  });

  it("returns null for both fields on an empty holder list", () => {
    const result = computeHolderConcentration([]);
    expect(result.topHolderPct).toBeNull();
    expect(result.top10Pct).toBeNull();
    expect(result.topHolderExceedsThreshold).toBe(false);
    expect(result.top10ExceedsThreshold).toBe(false);
  });

  it("returns null topHolderPct when the top holder's percentage is unknown", () => {
    const result = computeHolderConcentration([holder(null), holder(20)]);
    expect(result.topHolderPct).toBeNull();
    expect(result.topHolderExceedsThreshold).toBe(false);
  });
});
