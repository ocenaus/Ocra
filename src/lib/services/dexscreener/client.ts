import "server-only";
import { fetchJson, type ProviderResult } from "@/lib/services/http";
import type { TokenSocials } from "@/lib/services/types";

/**
 * DEXScreener — public API, no key required. Used as the reliable source
 * for social links (website/Telegram/Twitter): Moralis's token metadata
 * doesn't consistently include these across tokens, while DEXScreener
 * surfaces whatever the token's DEX listing itself declares.
 *
 * Docs referenced:
 *   GET https://api.dexscreener.com/latest/dex/tokens/{address}
 *
 * Not every pair on a token carries an `info` block, and a token can (rarely)
 * share its address across chains via CREATE2 — both handled by scanning all
 * returned pairs and keeping only Ethereum ones.
 */

const BASE_URL = "https://api.dexscreener.com/latest/dex/tokens";

interface DexScreenerSocial {
  type?: string;
  url?: string;
}

interface DexScreenerWebsite {
  label?: string;
  url?: string;
}

interface DexScreenerPair {
  chainId?: string;
  info?: {
    websites?: DexScreenerWebsite[];
    socials?: DexScreenerSocial[];
  };
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[] | null;
}

function findSocialUrl(socials: DexScreenerSocial[] | undefined, type: string): string | null {
  return socials?.find((s) => s.type?.toLowerCase() === type)?.url ?? null;
}

export async function getTokenSocials(address: string): Promise<ProviderResult<TokenSocials>> {
  const url = `${BASE_URL}/${address}`;
  const result = await fetchJson<DexScreenerResponse>(url);
  if (!result.ok) return result;

  const ethereumPairs = (result.data.pairs ?? []).filter((pair) => pair.chainId === "ethereum");
  if (ethereumPairs.length === 0) return { ok: false, reason: "not_found" };

  const socials: TokenSocials = { website: null, telegram: null, twitter: null };

  for (const pair of ethereumPairs) {
    socials.website ??= pair.info?.websites?.[0]?.url ?? null;
    socials.telegram ??= findSocialUrl(pair.info?.socials, "telegram");
    // DEXScreener still labels X as "twitter".
    socials.twitter ??= findSocialUrl(pair.info?.socials, "twitter") ?? findSocialUrl(pair.info?.socials, "x");
    if (socials.website && socials.telegram && socials.twitter) break;
  }

  if (!socials.website && !socials.telegram && !socials.twitter) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, data: socials };
}
