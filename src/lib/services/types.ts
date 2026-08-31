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
  /**
   * The address that deployed the contract, from Etherscan's contract
   * creation record. Not necessarily "the team" — a factory/launchpad
   * contract commonly appears here instead of an individual wallet, so the
   * UI must label this factually ("Contract creator"), never as "dev wallet".
   */
  creatorAddress: string | null;
}

/** Social/marketing links for a token, when a data provider actually has them. */
export interface TokenSocials {
  website: string | null;
  telegram: string | null;
  twitter: string | null;
}

/**
 * 24h trading volume for a single DEX pair (DEXScreener) or CEX listing
 * (CoinGecko tickers). CEX tickers carry no buy/sell breakdown — neither
 * provider exposes centralized order-flow composition — so `buyTxns24h`/
 * `sellTxns24h` are always null for `source: "cex"`, never estimated.
 */
export interface PairVolume {
  source: "dex" | "cex";
  /** DEXScreener `dexId` (e.g. "uniswap") or CoinGecko `market.identifier` (e.g. "binance"). */
  exchangeId: string;
  /** Human-readable, e.g. "Uniswap V3" or "Binance". */
  label: string;
  volumeUsd24h: number;
  /** Real transaction counts from DEXScreener, DEX pairs only. Never fabricated for CEX. */
  buyTxns24h: number | null;
  sellTxns24h: number | null;
  pairUrl: string | null;
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
  socials: TokenSocials;
  /**
   * Top pairs/listings by 24h volume, DEX and CEX combined, sorted
   * descending. Empty when neither provider has the token indexed — a
   * normal state for illiquid/unlisted tokens, not a reported gap (same
   * treatment as `socials`).
   */
  volumeBreakdown: PairVolume[];
  /** Human-readable notes on what's unavailable and why, for honest display — never silently hidden. */
  dataGaps: string[];
}
