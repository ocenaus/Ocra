import { getAddress, isAddress } from "viem";

export type SearchInputType = "address" | "ens" | "invalid";

const ENS_NAME_REGEX = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+eth$/i;

/**
 * Validates a user-provided Ethereum address. Accepts an all-lowercase,
 * all-uppercase, or a correctly EIP-55 checksummed address; rejects a
 * mixed-case address with an incorrect checksum (a common typo/paste
 * error and, in some contexts, a phishing tactic). Never trust an address
 * string from user input without running it through this first.
 */
export function isValidEthereumAddress(input: string): boolean {
  return isAddress(input.trim(), { strict: false }) && isChecksumSafe(input.trim());
}

function isChecksumSafe(address: string): boolean {
  const hex = address.slice(2);
  const isAllLower = hex === hex.toLowerCase();
  const isAllUpper = hex === hex.toUpperCase();
  if (isAllLower || isAllUpper) return true;

  try {
    // Mixed case: must match its own EIP-55 checksum exactly.
    return getAddress(address) === address;
  } catch {
    return false;
  }
}

/** Normalizes a validated address to its canonical lowercase form for storage/lookup. */
export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

/** Basic structural validation for a `.eth` ENS name (existence is resolved separately). */
export function isValidEnsName(input: string): boolean {
  return ENS_NAME_REGEX.test(input.trim());
}

/**
 * Classifies free-text search input (the homepage/radar search bar accepts
 * a wallet address, token contract address, or ENS name).
 */
export function classifySearchInput(input: string): SearchInputType {
  const trimmed = input.trim();
  if (!trimmed) return "invalid";
  if (isValidEthereumAddress(trimmed)) return "address";
  if (isValidEnsName(trimmed)) return "ens";
  return "invalid";
}
