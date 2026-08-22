import "server-only";
import { serverEnv } from "@/lib/env";
import { fetchJson, type ProviderResult } from "@/lib/services/http";
import type { HolderEntry, TokenMetadata, TokenPrice, TokenSocials } from "@/lib/services/types";

/**
 * Moralis Web3 Data API — Ethereum Mainnet only (chain=eth), matching V1
 * scope. Moralis is the only one of our providers with a general-purpose
 * "top token holders" endpoint, so it's the source of truth for the bubble
 * map's holder data.
 *
 * Docs referenced (may drift — Moralis has changed response shapes across
 * versions, which is why every field read here is optional-chained and
 * falls back to null rather than assumed):
 *   GET /erc20/metadata?chain=eth&addresses[0]={address}
 *   GET /erc20/{address}/price?chain=eth
 *   GET /erc20/{address}/owners?chain=eth&order=DESC&limit=100
 */

const BASE_URL = "https://deep-index.moralis.io/api/v2.2";

function isConfigured() {
  return Boolean(serverEnv.MORALIS_API_KEY);
}

function headers() {
  return {
    accept: "application/json",
    "X-API-Key": serverEnv.MORALIS_API_KEY,
  };
}

interface MoralisMetadataItem {
  address?: string;
  name?: string;
  symbol?: string;
  decimals?: string | number;
  logo?: string;
  thumbnail?: string;
  total_supply?: string;
  // Social/marketing fields aren't consistently documented across Moralis
  // API versions — every possible shape we've seen mentioned is checked
  // defensively in getTokenSocials below, and absence of any of them is
  // completely normal, not an error.
  links?: { website?: string; twitter?: string; telegram?: string };
  website?: string;
  twitter?: string;
  telegram?: string;
}

export async function getTokenMetadata(address: string): Promise<ProviderResult<TokenMetadata>> {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };

  const url = `${BASE_URL}/erc20/metadata?chain=eth&addresses%5B0%5D=${address}`;
  const result = await fetchJson<MoralisMetadataItem[]>(url, { headers: headers() });
  if (!result.ok) return result;

  const item = result.data[0];
  if (!item) return { ok: false, reason: "not_found" };

  const decimals =
    typeof item.decimals === "number" ? item.decimals : item.decimals ? Number(item.decimals) : null;

  return {
    ok: true,
    data: {
      address,
      name: item.name ?? null,
      symbol: item.symbol ?? null,
      decimals: decimals !== null && Number.isFinite(decimals) ? decimals : null,
      logoUrl: item.logo ?? item.thumbnail ?? null,
      totalSupplyRaw: item.total_supply ?? null,
    },
  };
}

/**
 * Best-effort social links from the same metadata endpoint. Moralis doesn't
 * consistently document these fields across versions/plans, so this is a
 * defensive scan, not a guaranteed field — an empty result here is normal
 * and just means the orchestrator falls back to DEXScreener.
 */
export async function getTokenSocials(address: string): Promise<ProviderResult<TokenSocials>> {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };

  const url = `${BASE_URL}/erc20/metadata?chain=eth&addresses%5B0%5D=${address}`;
  const result = await fetchJson<MoralisMetadataItem[]>(url, { headers: headers() });
  if (!result.ok) return result;

  const item = result.data[0];
  if (!item) return { ok: false, reason: "not_found" };

  const website = item.links?.website ?? item.website ?? null;
  const twitter = item.links?.twitter ?? item.twitter ?? null;
  const telegram = item.links?.telegram ?? item.telegram ?? null;

  if (!website && !twitter && !telegram) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, data: { website, twitter, telegram } };
}

interface MoralisPriceResponse {
  usdPrice?: number;
}

export async function getTokenPrice(address: string): Promise<ProviderResult<TokenPrice>> {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };

  const url = `${BASE_URL}/erc20/${address}/price?chain=eth`;
  const result = await fetchJson<MoralisPriceResponse>(url, { headers: headers() });
  if (!result.ok) return result;

  const usdPrice = typeof result.data.usdPrice === "number" ? result.data.usdPrice : null;
  return { ok: true, data: { usdPrice, source: usdPrice !== null ? "moralis" : null } };
}

interface MoralisOwnerItem {
  owner_address?: string;
  balance?: string;
  balance_formatted?: string;
  percentage_relative_to_total_supply?: number;
  is_contract?: boolean;
}

interface MoralisOwnersResponse {
  result?: MoralisOwnerItem[];
}

export async function getTokenHolders(
  address: string,
  limit: number,
): Promise<ProviderResult<HolderEntry[]>> {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };

  const url = `${BASE_URL}/erc20/${address}/owners?chain=eth&order=DESC&limit=${limit}`;
  const result = await fetchJson<MoralisOwnersResponse>(url, { headers: headers() });
  if (!result.ok) return result;

  const holders = (result.data.result ?? [])
    .filter((item): item is MoralisOwnerItem & { owner_address: string; balance: string } =>
      Boolean(item.owner_address && item.balance),
    )
    .map((item) => ({
      address: item.owner_address,
      balanceRaw: item.balance,
      balanceFormatted: item.balance_formatted ? Number(item.balance_formatted) : null,
      percentageOfSupply:
        typeof item.percentage_relative_to_total_supply === "number"
          ? item.percentage_relative_to_total_supply
          : null,
      isContract: item.is_contract ?? null,
    }));

  return { ok: true, data: holders };
}
