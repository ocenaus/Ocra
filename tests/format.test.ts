import { describe, expect, it } from "vitest";
import { formatUsd } from "@/lib/format";

describe("formatUsd", () => {
  it("returns 'Data unavailable' for null", () => {
    expect(formatUsd(null)).toBe("Data unavailable");
  });

  it("shows '<$0.01' for a positive value under one cent", () => {
    expect(formatUsd(0.001)).toBe("<$0.01");
  });

  it("formats sub-dollar values with up to 6 fraction digits", () => {
    expect(formatUsd(0.123456)).toBe("$0.123456");
  });

  it("formats standard values as USD currency", () => {
    expect(formatUsd(42.5)).toBe("$42.50");
  });

  it("formats millions with a fixed two decimal places, never trimming a trailing zero", () => {
    // The exact value that exposed a real SSR/hydration mismatch: Node's
    // and the browser's Intl compact-currency notation disagreed on
    // whether to trim this to "$2.9M" — the hand-rolled path is
    // deterministic across environments.
    expect(formatUsd(2_900_000)).toBe("$2.90M");
  });

  it("formats billions the same way", () => {
    expect(formatUsd(1_500_000_000)).toBe("$1.50B");
  });

  it("rounds within the compact range", () => {
    expect(formatUsd(746_990_000)).toBe("$746.99M");
  });
});
