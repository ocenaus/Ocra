import { describe, expect, it } from "vitest";
import { formatPriceChangePercent } from "@/lib/format";

describe("formatPriceChangePercent", () => {
  it("prefixes positive changes with a plus sign", () => {
    expect(formatPriceChangePercent(4.2)).toBe("+4.20%");
  });

  it("keeps the native minus sign for negative changes", () => {
    expect(formatPriceChangePercent(-1.23)).toBe("-1.23%");
  });

  it("does not collapse small-but-real changes the way formatPercentage does", () => {
    expect(formatPriceChangePercent(0.004)).toBe("+0.00%");
  });

  it("returns an em dash for unknown values", () => {
    expect(formatPriceChangePercent(null)).toBe("—");
  });

  it("shows exactly zero without a sign", () => {
    expect(formatPriceChangePercent(0)).toBe("0.00%");
  });
});
