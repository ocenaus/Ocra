import "server-only";
import * as moralis from "@/lib/services/moralis/client";
import * as alchemy from "@/lib/services/alchemy/client";
import * as etherscan from "@/lib/services/etherscan/client";
import { analyzeCapabilities } from "@/lib/services/etherscan/capabilities";
import { computeMarketCapUsd, computePercentageOfSupply } from "@/lib/services/token/math";
import type { ContractAnalysis, HolderEntry, TokenDetails, TokenMetadata, TokenPrice } from "@/lib/services/types";

const DEFAULT_HOLDER_LIMIT = 100;

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
      },
      gaps,
    };
  }

  const ownerCall = await alchemy.getContractOwner(address);
  if (!ownerCall.ok) {
    gaps.push("Owner address could not be read on-chain — the contract may not expose a standard owner() function.");
  }

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
    },
    gaps,
  };
}

export async function getTokenDetails(address: string): Promise<TokenDetails> {
  const [{ metadata, gaps: metadataGaps }, { price, gaps: priceGaps }, { contract, gaps: contractGaps }] =
    await Promise.all([resolveMetadata(address), resolvePrice(address), resolveContractAnalysis(address)]);

  const marketCapUsd = computeMarketCapUsd(price.usdPrice, metadata.totalSupplyRaw, metadata.decimals);

  return {
    address,
    metadata,
    price,
    marketCapUsd,
    totalHoldersCount: null, // populated by the holders endpoint, kept separate to avoid a second heavy call here
    contract,
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
