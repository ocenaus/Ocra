import { describe, expect, it } from "vitest";
import {
  classifySearchInput,
  isValidEnsName,
  isValidEthereumAddress,
  normalizeAddress,
} from "@/lib/validation/ethereum";

// A real, well-known checksummed address (WETH contract) used only as a
// fixed test fixture — no network calls, no live data.
const WETH_LOWER = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const WETH_CHECKSUM = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

describe("isValidEthereumAddress", () => {
  it("accepts an all-lowercase address", () => {
    expect(isValidEthereumAddress(WETH_LOWER)).toBe(true);
  });

  it("accepts a correctly checksummed mixed-case address", () => {
    expect(isValidEthereumAddress(WETH_CHECKSUM)).toBe(true);
  });

  it("rejects a mixed-case address with an incorrect checksum", () => {
    // Same underlying address, but the first hex letter's case is flipped
    // relative to its correct EIP-55 checksum casing.
    const tampered = "0xc" + WETH_CHECKSUM.slice(3);
    expect(tampered.toLowerCase()).toBe(WETH_LOWER);
    expect(isValidEthereumAddress(tampered)).toBe(false);
  });

  it("rejects addresses that are too short", () => {
    expect(isValidEthereumAddress("0x1234")).toBe(false);
  });

  it("rejects addresses without a 0x prefix", () => {
    expect(isValidEthereumAddress(WETH_LOWER.slice(2))).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(isValidEthereumAddress("0xzzzzaa39b223fe8d0a0e5c4f27ead9083c756cc2")).toBe(false);
  });

  it("rejects empty input", () => {
    expect(isValidEthereumAddress("")).toBe(false);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(isValidEthereumAddress(`  ${WETH_LOWER}  `)).toBe(true);
  });
});

describe("normalizeAddress", () => {
  it("lowercases and trims an address for storage/lookup", () => {
    expect(normalizeAddress(` ${WETH_CHECKSUM} `)).toBe(WETH_LOWER);
  });
});

describe("isValidEnsName", () => {
  it("accepts a simple .eth name", () => {
    expect(isValidEnsName("vitalik.eth")).toBe(true);
  });

  it("accepts a subdomain .eth name", () => {
    expect(isValidEnsName("sub.vitalik.eth")).toBe(true);
  });

  it("rejects a name without the .eth suffix", () => {
    expect(isValidEnsName("vitalik")).toBe(false);
  });

  it("rejects an address mistaken for an ENS name", () => {
    expect(isValidEnsName(WETH_LOWER)).toBe(false);
  });
});

describe("classifySearchInput", () => {
  it("classifies a valid address", () => {
    expect(classifySearchInput(WETH_LOWER)).toBe("address");
  });

  it("classifies a valid ENS name", () => {
    expect(classifySearchInput("vitalik.eth")).toBe("ens");
  });

  it("classifies garbage input as invalid", () => {
    expect(classifySearchInput("not an address")).toBe("invalid");
  });

  it("classifies empty input as invalid", () => {
    expect(classifySearchInput("   ")).toBe("invalid");
  });
});
