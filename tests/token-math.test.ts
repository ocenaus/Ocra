import { describe, expect, it } from "vitest";
import {
  computeBubbleRadii,
  computeMarketCapUsd,
  computePercentageOfSupply,
  computeStreamWidths,
  rawToDecimal,
} from "@/lib/services/token/math";

describe("rawToDecimal", () => {
  it("converts a base-unit integer string using the given decimals", () => {
    expect(rawToDecimal("1000000000000000000", 18)).toBe(1);
    expect(rawToDecimal("1500000", 6)).toBe(1.5);
  });

  it("handles zero decimals", () => {
    expect(rawToDecimal("42", 0)).toBe(42);
  });

  it("returns null for non-numeric input", () => {
    expect(rawToDecimal("not-a-number", 18)).toBeNull();
  });

  it("returns null for negative decimals", () => {
    expect(rawToDecimal("100", -1)).toBeNull();
  });
});

describe("computeMarketCapUsd", () => {
  it("multiplies price by decimal-adjusted total supply", () => {
    // 1,000,000 tokens (18 decimals) at $2 each = $2,000,000
    const totalSupplyRaw = (BigInt(1_000_000) * BigInt(10) ** BigInt(18)).toString();
    expect(computeMarketCapUsd(2, totalSupplyRaw, 18)).toBe(2_000_000);
  });

  it("returns null when price is unavailable", () => {
    expect(computeMarketCapUsd(null, "1000000000000000000", 18)).toBeNull();
  });

  it("returns null when total supply is unavailable", () => {
    expect(computeMarketCapUsd(2, null, 18)).toBeNull();
  });

  it("returns null when decimals is unavailable", () => {
    expect(computeMarketCapUsd(2, "1000000000000000000", null)).toBeNull();
  });
});

describe("computePercentageOfSupply", () => {
  it("computes a holder's share of total supply as a percentage", () => {
    const totalSupply = (BigInt(1000) * BigInt(10) ** BigInt(18)).toString();
    const balance = (BigInt(100) * BigInt(10) ** BigInt(18)).toString();
    expect(computePercentageOfSupply(balance, totalSupply, 18)).toBeCloseTo(10, 5);
  });

  it("returns null when total supply is zero", () => {
    expect(computePercentageOfSupply("100", "0", 18)).toBeNull();
  });

  it("returns null for non-numeric input", () => {
    expect(computePercentageOfSupply("abc", "1000", 18)).toBeNull();
  });
});

describe("computeBubbleRadii", () => {
  it("scales radii by percentage with area (not radius) proportional to value", () => {
    // minRadius: 0 isolates the sqrt relationship from the floor offset.
    const radii = computeBubbleRadii([100, 25], { minRadius: 0, maxRadius: 100 });
    // sqrt(100)=10, sqrt(25)=5 -> ratio 2:1, so radius ratio should be 2:1
    expect(radii[0] / radii[1]).toBeCloseTo(2, 1);
  });

  it("assigns the minimum radius to holders with an unknown percentage", () => {
    const radii = computeBubbleRadii([50, null], { minRadius: 6, maxRadius: 90 });
    expect(radii[1]).toBe(6);
  });

  it("handles an all-null input without throwing", () => {
    const radii = computeBubbleRadii([null, null], { minRadius: 6, maxRadius: 90 });
    expect(radii).toEqual([6, 6]);
  });

  it("clamps the largest holder to the max radius", () => {
    const radii = computeBubbleRadii([100], { minRadius: 6, maxRadius: 90 });
    expect(radii[0]).toBe(90);
  });
});

describe("computeStreamWidths", () => {
  it("scales widths by volume with area (not width) proportional to value", () => {
    const widths = computeStreamWidths([100, 25], { minWidth: 0, maxWidth: 100 });
    expect(widths[0] / widths[1]).toBeCloseTo(2, 1);
  });

  it("assigns the minimum width to a zero-volume pair", () => {
    const widths = computeStreamWidths([500, 0], { minWidth: 3, maxWidth: 28 });
    expect(widths[1]).toBe(3);
  });

  it("handles a single pair without throwing", () => {
    const widths = computeStreamWidths([12345], { minWidth: 3, maxWidth: 28 });
    expect(widths[0]).toBe(28);
  });

  it("clamps the largest volume to the max width", () => {
    const widths = computeStreamWidths([100], { minWidth: 3, maxWidth: 28 });
    expect(widths[0]).toBe(28);
  });
});
