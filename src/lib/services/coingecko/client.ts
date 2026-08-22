import "server-only";
import { serverEnv } from "@/lib/env";
import { fetchJson, type ProviderResult } from "@/lib/services/http";
import type { CoinGeckoData } from "@/lib/services/types";

/**
 * CoinGecko Demo API — extended market data (multi-timeframe price change,
 * tokenomics, coin info/links) looked up by contract address. Free "Demo"
 * plan, sent as the x-cg-demo-api-key header.
 *
 * Coverage is not universal: CoinGecko only has data for tokens it has
 * indexed, which excludes plenty of small/new/obscure tokens. A 404 here is
 * a normal, expected outcome, not a provider failure — callers should treat
 * `not_found` as "this token isn't tracked here," not as a gap to report.
 *
 * Docs referenced:
 *   GET https://api.coingecko.com/api/v3/coins/ethereum/contract/{address}
 */

const BASE_URL = "https://api.coingecko.com/api/v3";
const PLATFORM = "ethereum";

function isConfigured() {
  return Boolean(serverEnv.COINGECKO_API_KEY);
}

function headers() {
  return {
    accept: "application/json",
    "x-cg-demo-api-key": serverEnv.COINGECKO_API_KEY,
  };
}

interface CoinGeckoMarketData {
  market_cap?: { usd?: number };
  fully_diluted_valuation?: { usd?: number };
  total_volume?: { usd?: number };
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number;
  price_change_percentage_1h_in_currency?: { usd?: number };
  price_change_percentage_24h_in_currency?: { usd?: number };
  price_change_percentage_7d_in_currency?: { usd?: number };
  price_change_percentage_14d_in_currency?: { usd?: number };
  price_change_percentage_30d_in_currency?: { usd?: number };
  price_change_percentage_1y_in_currency?: { usd?: number };
}

interface CoinGeckoLinksRaw {
  homepage?: string[];
  blockchain_site?: string[];
  twitter_screen_name?: string;
  telegram_channel_identifier?: string;
  subreddit_url?: string;
  repos_url?: { github?: string[] };
}

interface CoinGeckoContractResponse {
  id?: string;
  categories?: string[];
  platforms?: Record<string, string>;
  links?: CoinGeckoLinksRaw;
  market_data?: CoinGeckoMarketData;
}

function firstNonEmpty(values: string[] | undefined): string | null {
  return values?.find((v) => v.trim().length > 0) ?? null;
}

function allNonEmpty(values: string[] | undefined): string[] {
  return Array.from(new Set((values ?? []).filter((v) => v.trim().length > 0)));
}

function mapContractResponse(data: CoinGeckoContractResponse): CoinGeckoData {
  const md = data.market_data ?? {};
  const links = data.links ?? {};

  return {
    priceChange: {
      h1: md.price_change_percentage_1h_in_currency?.usd ?? null,
      h24: md.price_change_percentage_24h_in_currency?.usd ?? null,
      d7: md.price_change_percentage_7d_in_currency?.usd ?? null,
      d14: md.price_change_percentage_14d_in_currency?.usd ?? null,
      d30: md.price_change_percentage_30d_in_currency?.usd ?? null,
      y1: md.price_change_percentage_1y_in_currency?.usd ?? null,
    },
    info: {
      coingeckoId: data.id ?? "",
      categories: (data.categories ?? []).filter((c): c is string => Boolean(c)),
      chains: Object.entries(data.platforms ?? {})
        .filter(([platform]) => platform.trim().length > 0)
        .map(([platform, contractAddress]) => ({
          platform,
          contractAddress: contractAddress && contractAddress.trim().length > 0 ? contractAddress : null,
        })),
      links: {
        website: firstNonEmpty(links.homepage),
        explorers: allNonEmpty(links.blockchain_site),
        twitter: links.twitter_screen_name ? `https://x.com/${links.twitter_screen_name}` : null,
        telegram: links.telegram_channel_identifier ? `https://t.me/${links.telegram_channel_identifier}` : null,
        reddit: links.subreddit_url && links.subreddit_url.trim().length > 0 ? links.subreddit_url : null,
        github: firstNonEmpty(links.repos_url?.github),
      },
    },
    tokenomics: {
      circulatingSupply: md.circulating_supply ?? null,
      totalSupply: md.total_supply ?? null,
      maxSupply: md.max_supply ?? null,
      marketCapUsd: md.market_cap?.usd ?? null,
      fullyDilutedValuationUsd: md.fully_diluted_valuation?.usd ?? null,
      volume24hUsd: md.total_volume?.usd ?? null,
    },
  };
}

export async function getTokenData(address: string): Promise<ProviderResult<CoinGeckoData>> {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };

  const params = new URLSearchParams({
    localization: "false",
    tickers: "false",
    market_data: "true",
    community_data: "false",
    developer_data: "false",
    sparkline: "false",
    price_change_percentage: "1h,24h,7d,14d,30d,1y",
  });
  const url = `${BASE_URL}/coins/${PLATFORM}/contract/${address}?${params.toString()}`;
  const result = await fetchJson<CoinGeckoContractResponse>(url, { headers: headers() });
  if (!result.ok) return result;

  if (!result.data.id) return { ok: false, reason: "not_found" };

  return { ok: true, data: mapContractResponse(result.data) };
}
