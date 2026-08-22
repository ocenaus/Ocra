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

export interface HolderEntry {
  address: string;
  /** Raw base-unit balance as a decimal string. */
  balanceRaw: string;
  balanceFormatted: number | null;
  /** 0-100. Null if total supply is unknown and the percentage can't be computed. */
  percentageOfSupply: number | null;
  isContract: boolean | null;
}

/** Percent price change over each timeframe, from CoinGecko. Null = unavailable for that timeframe specifically. */
export interface PriceChangePercentages {
  h1: number | null;
  h24: number | null;
  d7: number | null;
  d14: number | null;
  d30: number | null;
  y1: number | null;
}

/** A chain CoinGecko lists this token on, with its contract address there (may differ from the address the user searched). */
export interface CoinChainListing {
  platform: string;
  contractAddress: string | null;
}

export interface CoinGeckoLinks {
  website: string | null;
  explorers: string[];
  twitter: string | null;
  telegram: string | null;
  reddit: string | null;
  github: string | null;
}

export interface CoinInfo {
  coingeckoId: string;
  categories: string[];
  chains: CoinChainListing[];
  links: CoinGeckoLinks;
}

export interface Tokenomics {
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  marketCapUsd: number | null;
  fullyDilutedValuationUsd: number | null;
  volume24hUsd: number | null;
}

/** Extended market data from CoinGecko. Absent entirely (null) for tokens CoinGecko doesn't list — common for small/new tokens, not treated as an error. */
export interface CoinGeckoData {
  priceChange: PriceChangePercentages;
  info: CoinInfo;
  tokenomics: Tokenomics;
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
  coingecko: CoinGeckoData | null;
  /** Human-readable notes on what's unavailable and why, for honest display — never silently hidden. */
  dataGaps: string[];
}
