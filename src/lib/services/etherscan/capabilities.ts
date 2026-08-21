/**
 * Pure text-based heuristics over verified Solidity source code. These are
 * deliberately simple pattern matches, not a real static analyzer — they
 * can both miss obfuscated implementations and flag dead/inherited-but-
 * unused code. That's an acceptable tradeoff for a "does this contract
 * plausibly have this capability" signal, as long as we're honest that it's
 * a heuristic. Only ever called with source code we already know is
 * verified — callers must report "unknown" for unverified contracts rather
 * than invoking this.
 */
export interface CapabilityFlags {
  hasMintFunction: boolean;
  hasBurnFunction: boolean;
  hasPauseFunction: boolean;
  hasBlacklistFunction: boolean;
  hasOwnerPrivileges: boolean;
}

const PATTERNS = {
  hasMintFunction: /function\s+mint\s*\(/i,
  hasBurnFunction: /function\s+burn(?:From)?\s*\(/i,
  hasPauseFunction: /function\s+(?:pause|unpause)\s*\(|\bPausable\b|whenNotPaused/i,
  hasBlacklistFunction: /function\s+(?:blacklist|blocklist|unblacklist)\s*\(|isBlacklisted|_blacklist/i,
  hasOwnerPrivileges: /\bonlyOwner\b|\bOwnable\b/,
} as const;

export function analyzeCapabilities(sourceCode: string): CapabilityFlags {
  return {
    hasMintFunction: PATTERNS.hasMintFunction.test(sourceCode),
    hasBurnFunction: PATTERNS.hasBurnFunction.test(sourceCode),
    hasPauseFunction: PATTERNS.hasPauseFunction.test(sourceCode),
    hasBlacklistFunction: PATTERNS.hasBlacklistFunction.test(sourceCode),
    hasOwnerPrivileges: PATTERNS.hasOwnerPrivileges.test(sourceCode),
  };
}
