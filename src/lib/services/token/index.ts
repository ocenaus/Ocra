import "server-only";
import * as moralis from "@/lib/services/moralis/client";
import * as alchemy from "@/lib/services/alchemy/client";
import * as etherscan from "@/lib/services/etherscan/client";
import * as dexscreener from "@/lib/services/dexscreener/client";
import * as coingecko from "@/lib/services/coingecko/client";
import { analyzeCapabilities } from "@/lib/services/etherscan/capabilities";
import { computeMarketCapUsd, computePercentageOfSupply } from "@/lib/services/token/math";
import type {
  ContractAnalysis,
  HolderEntry,
  PairVolume,
  TokenDetails,
  TokenMetadata,
  TokenPrice,
  TokenSocials,
} from "@/lib/services/types";

const DEFAULT_HOLDER_LIMIT = 100;
const MAX_COMBINED_VOLUME_STREAMS = 8;

async function resolveMetadata(address: string): Promise<{ metadata: TokenMetadata; gaps: string[] }> {
  const gaps: string[] = [];

  const primary = await moralis.getTokenMetadata(address);
  if (primary.ok) {
    // Moralis metadata doesn't reliably include total supply across all
    // tokens — Etherscan's dedicated endpoint is a more consistent source.
    if (!primary.data.totalSupplyRaw) {
      const supply = await etherscan.getTotalSupply(address);
      if (supply.ok) {
        return { metadata: { ...primary.data, totalSupplyRaw: supply.data }, gaps };
      }
      gaps.push("Total supply unavailable.");
    }
    return { metadata: primary.data, gaps };
  }

  const fallback = await alchemy.getTokenMetadata(address);
  if (fallback.ok) {
    const supply = await etherscan.getTotalSupply(address);
    return {
      metadata: { ...fallback.data, totalSupplyRaw: supply.ok ? supply.data : null },
      gaps: supply.ok ? gaps : [...gaps, "Total supply unavailable."],
    };
  }

  const bothNotConfigured = primary.reason === "not_configured" && fallback.reason === "not_configured";
  gaps.push(
    bothNotConfigured
      ? "Token metadata is not configured — set ALCHEMY_API_KEY or MORALIS_API_KEY."
      : "Token metadata is temporarily unavailable from Alchemy and Moralis.",
  );
  return {
    metadata: { address, name: null, symbol: null, decimals: null, logoUrl: null, totalSupplyRaw: null },
    gaps,
  };
}

async function resolvePrice(address: string): Promise<{ price: TokenPrice; gaps: string[] }> {
  const primary = await moralis.getTokenPrice(address);
  if (primary.ok) return { price: primary.data, gaps: [] };

  const fallback = await alchemy.getTokenPrice(address);
  if (fallback.ok) return { price: fallback.data, gaps: [] };

  const bothNotConfigured = primary.reason === "not_configured" && fallback.reason === "not_configured";
  return {
    price: { usdPrice: null, source: null },
    gaps: [
      bothNotConfigured
        ? "Price is not configured — set ALCHEMY_API_KEY or MORALIS_API_KEY."
        : "Price is temporarily unavailable.",
    ],
  };
}

async function resolveContractAnalysis(address: string): Promise<{ contract: ContractAnalysis; gaps: string[] }> {
  const gaps: string[] = [];
  const source = await etherscan.getContractSource(address);

  if (!source.ok) {
    gaps.push(
      source.reason === "not_configured"
        ? "Contract analysis is not configured — set ETHERSCAN_API_KEY."
        : "Contract source lookup failed.",
    );
    return {
      contract: {
        isVerified: null,
        contractName: null,
        ownerAddress: null,
        isOwnershipRenounced: null,
        hasMintFunction: null,
        hasBurnFunction: null,
        hasPauseFunction: null,
        hasBlacklistFunction: null,
        isProxy: null,
        implementationAddress: null,
        creatorAddress: null,
      },
      gaps,
    };
  }

  const [ownerCall, creatorCall] = await Promise.all([
    alchemy.getContractOwner(address),
    etherscan.getContractCreator(address),
  ]);
  if (!ownerCall.ok) {
    gaps.push("Owner address could not be read on-chain — the contract may not expose a standard owner() function.");
  }
  // Creator lookup failing isn't pushed as a gap — the creator-highlight
  // feature simply doesn't activate, which is self-evident in the UI.
  const creatorAddress = creatorCall.ok ? creatorCall.data : null;

  if (!source.data.isVerified) {
    return {
      contract: {
        isVerified: false,
        contractName: source.data.contractName,
        ownerAddress: ownerCall.ok ? ownerCall.data.ownerAddress : null,
        isOwnershipRenounced: ownerCall.ok ? ownerCall.data.isRenounced : null,
        hasMintFunction: null,
        hasBurnFunction: null,
        hasPauseFunction: null,
        hasBlacklistFunction: null,
        isProxy: source.data.isProxy,
        implementationAddress: source.data.implementationAddress,
        creatorAddress,
      },
      gaps: [...gaps, "Contract is not verified on Etherscan — mint/burn/pause/blacklist capabilities can't be confirmed."],
    };
  }

  const capabilities = analyzeCapabilities(source.data.sourceCode);

  return {
    contract: {
      isVerified: true,
      contractName: source.data.contractName,
      ownerAddress: ownerCall.ok ? ownerCall.data.ownerAddress : null,
      isOwnershipRenounced: ownerCall.ok ? ownerCall.data.isRenounced : null,
      hasMintFunction: capabilities.hasMintFunction,
      hasBurnFunction: capabilities.hasBurnFunction,
      hasPauseFunction: capabilities.hasPauseFunction,
      hasBlacklistFunction: capabilities.hasBlacklistFunction,
      isProxy: source.data.isProxy,
      implementationAddress: source.data.implementationAddress,
      creatorAddress,
    },
    gaps,
  };
}

/**
 * Merges social links across providers, preferring Moralis (when it has
 * them) and filling gaps from DEXScreener. Absence of any link is normal
 * (not every token has a Telegram, etc.) so this never contributes to
 * dataGaps — the UI just hides whichever icons don't resolve.
 *
 * Also resolves the volume-currents breakdown alongside it: DEXScreener's
 * pairs response already carries both, so this is one DEXScreener fetch
 * (via `dexscreener.getMarketData`) plus one CoinGecko fetch for CEX
 * tickers, run in parallel. Absence of volume data is likewise normal (an
 * illiquid or unindexed token) and not reported as a gap — the UI shows an
 * honest empty state instead.
 */
async function resolveMarketActivity(
  address: string,
): Promise<{ socials: TokenSocials; volumeBreakdown: PairVolume[] }> {
  const [moralisResult, dexscreenerResult, coingeckoResult] = await Promise.all([
    moralis.getTokenSocials(address),
    dexscreener.getMarketData(address),
    coingecko.getCexTickers(address),
  ]);

  const fromMoralis = moralisResult.ok ? moralisResult.data : null;
  const dexMarketData = dexscreenerResult.ok ? dexscreenerResult.data : null;
  const cexVolume = coingeckoResult.ok ? coingeckoResult.data : [];

  const socials: TokenSocials = {
    website: fromMoralis?.website ?? dexMarketData?.socials.website ?? null,
    telegram: fromMoralis?.telegram ?? dexMarketData?.socials.telegram ?? null,
    twitter: fromMoralis?.twitter ?? dexMarketData?.socials.twitter ?? null,
  };

  const volumeBreakdown = [...(dexMarketData?.dexVolume ?? []), ...cexVolume]
    .sort((a, b) => b.volumeUsd24h - a.volumeUsd24h)
    .slice(0, MAX_COMBINED_VOLUME_STREAMS);

  return { socials, volumeBreakdown };
}

export async function getTokenDetails(address: string): Promise<TokenDetails> {
  const [
    { metadata, gaps: metadataGaps },
    { price, gaps: priceGaps },
    { contract, gaps: contractGaps },
    { socials, volumeBreakdown },
  ] = await Promise.all([
    resolveMetadata(address),
    resolvePrice(address),
    resolveContractAnalysis(address),
    resolveMarketActivity(address),
  ]);

  const marketCapUsd = computeMarketCapUsd(price.usdPrice, metadata.totalSupplyRaw, metadata.decimals);

  return {
    address,
    metadata,
    price,
    marketCapUsd,
    totalHoldersCount: null, // populated by the holders endpoint, kept separate to avoid a second heavy call here
    contract,
    socials,
    volumeBreakdown,
    dataGaps: [...metadataGaps, ...priceGaps, ...contractGaps],
  };
}

export async function getTokenHolders(
  address: string,
  totalSupplyRaw: string | null,
  decimals: number | null,
  limit: number = DEFAULT_HOLDER_LIMIT,
): Promise<{ holders: HolderEntry[]; gaps: string[] }> {
  const result = await moralis.getTokenHolders(address, limit);

  if (!result.ok) {
    return {
      holders: [],
      gaps: [
        result.reason === "not_configured"
          ? "Holder data is not configured — set MORALIS_API_KEY."
          : "Holder data is temporarily unavailable.",
      ],
    };
  }

  const holders = result.data.map((holder) => {
    if (holder.percentageOfSupply !== null) return holder;
    if (totalSupplyRaw === null || decimals === null) return holder;
    return {
      ...holder,
      percentageOfSupply: computePercentageOfSupply(holder.balanceRaw, totalSupplyRaw, decimals),
    };
  });

  return { holders, gaps: [] };
}
