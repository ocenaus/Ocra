import "server-only";
import { fetchJson, type ProviderResult } from "@/lib/services/http";
import type { PairVolume, TokenSocials } from "@/lib/services/types";

/**
 * DEXScreener — public API, no key required. Single source for two things
 * that both come out of the same response: social links (website/Telegram/
 * Twitter, since Moralis's token metadata doesn't consistently include
 * them) and per-pair 24h trading volume + buy/sell transaction counts for
 * the volume-currents visualization. Both are derived from one fetch —
 * `getMarketData` — so a page load doesn't issue two identical requests to
 * the same endpoint.
 *
 * Docs referenced:
 *   GET https://api.dexscreener.com/latest/dex/tokens/{address}
 *
 * Not every pair on a token carries an `info` block, and a token can (rarely)
 * share its address across chains via CREATE2 — both handled by scanning all
 * returned pairs and keeping only Ethereum ones.
 */

const BASE_URL = "https://api.dexscreener.com/latest/dex/tokens";
const MAX_DEX_PAIRS = 6;

interface DexScreenerSocial {
  type?: string;
  url?: string;
}

interface DexScreenerWebsite {
  label?: string;
  url?: string;
}

interface DexScreenerTxnCounts {
  buys?: number;
  sells?: number;
}

interface DexScreenerPair {
  chainId?: string;
  dexId?: string;
  pairAddress?: string;
  url?: string;
  labels?: string[];
  volume?: { h24?: number };
  txns?: { h24?: DexScreenerTxnCounts };
  info?: {
    websites?: DexScreenerWebsite[];
    socials?: DexScreenerSocial[];
  };
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[] | null;
}

async function fetchEthereumPairs(address: string): Promise<ProviderResult<DexScreenerPair[]>> {
  const url = `${BASE_URL}/${address}`;
  const result = await fetchJson<DexScreenerResponse>(url);
  if (!result.ok) return result;

  const ethereumPairs = (result.data.pairs ?? []).filter((pair) => pair.chainId === "ethereum");
  if (ethereumPairs.length === 0) return { ok: false, reason: "not_found" };

  return { ok: true, data: ethereumPairs };
}

function findSocialUrl(socials: DexScreenerSocial[] | undefined, type: string): string | null {
  return socials?.find((s) => s.type?.toLowerCase() === type)?.url ?? null;
}

function extractSocials(pairs: DexScreenerPair[]): TokenSocials {
  const socials: TokenSocials = { website: null, telegram: null, twitter: null };

  for (const pair of pairs) {
    socials.website ??= pair.info?.websites?.[0]?.url ?? null;
    socials.telegram ??= findSocialUrl(pair.info?.socials, "telegram");
    // DEXScreener still labels X as "twitter".
    socials.twitter ??= findSocialUrl(pair.info?.socials, "twitter") ?? findSocialUrl(pair.info?.socials, "x");
    if (socials.website && socials.telegram && socials.twitter) break;
  }

  return socials;
}

/** "uniswap" + ["v3"] -> "Uniswap V3"; "sushiswap" + [] -> "Sushiswap". */
function formatDexLabel(dexId: string, labels: string[] | undefined): string {
  const name = dexId
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const suffix = (labels ?? []).map((l) => l.toUpperCase()).join(" ");
  return suffix ? `${name} ${suffix}` : name;
}

function extractDexVolume(pairs: DexScreenerPair[]): PairVolume[] {
  const volumes: PairVolume[] = [];

  for (const pair of pairs) {
    if (!pair.dexId || !pair.volume?.h24 || pair.volume.h24 <= 0) continue;
    volumes.push({
      source: "dex",
      exchangeId: pair.dexId,
      label: formatDexLabel(pair.dexId, pair.labels),
      volumeUsd24h: pair.volume.h24,
      buyTxns24h: pair.txns?.h24?.buys ?? null,
      sellTxns24h: pair.txns?.h24?.sells ?? null,
      pairUrl: pair.url ?? null,
    });
  }

  return volumes.sort((a, b) => b.volumeUsd24h - a.volumeUsd24h).slice(0, MAX_DEX_PAIRS);
}

export async function getMarketData(
  address: string,
): Promise<ProviderResult<{ socials: TokenSocials; dexVolume: PairVolume[] }>> {
  const pairsResult = await fetchEthereumPairs(address);
  if (!pairsResult.ok) return pairsResult;

  return {
    ok: true,
    data: {
      socials: extractSocials(pairsResult.data),
      dexVolume: extractDexVolume(pairsResult.data),
    },
  };
}
