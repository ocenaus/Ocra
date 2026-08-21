export interface TokenMetadata {
  address: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  logoUrl: string | null;
  /** Raw base-unit total supply as a decimal string (avoids float precision loss). */
  totalSupplyRaw: string | null;
}

export interface TokenPrice {
  usdPrice: number | null;
  source: "alchemy" | "moralis" | null;
}

export interface ContractAnalysis {
  /** null = unknown (couldn't be determined), not "false". */
  isVerified: boolean | null;
  contractName: string | null;
  ownerAddress: string | null;
  isOwnershipRenounced: boolean | null;
  hasMintFunction: boolean | null;
  hasBurnFunction: boolean | null;
  hasPauseFunction: boolean | null;
  hasBlacklistFunction: boolean | null;
  isProxy: boolean | null;
  implementationAddress: string | null;
}

export interface HolderEntry {
  address: string;
  /** Raw base-unit balance as a decimal string. */
  balanceRaw: string;
  balanceFormatted: number | null;
  /** 0-100. Null if total supply is unknown and the percentage can't be computed. */
  percentageOfSupply: number | null;
  isContract: boolean | null;
}

export interface TokenDetails {
  address: string;
  metadata: TokenMetadata;
  price: TokenPrice;
  /** price * total supply, always labeled "estimated" in the UI — not a circulating-supply figure. */
  marketCapUsd: number | null;
  totalHoldersCount: number | null;
  contract: ContractAnalysis;
  /** Human-readable notes on what's unavailable and why, for honest display — never silently hidden. */
  dataGaps: string[];
}
