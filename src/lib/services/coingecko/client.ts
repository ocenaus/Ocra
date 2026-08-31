import "server-only";
import { serverEnv } from "@/lib/env";
import { fetchJson, type ProviderResult } from "@/lib/services/http";
import type { PairVolume } from "@/lib/services/types";

/**
 * CoinGecko — used for exactly one thing: centralized-exchange (CEX) 24h
 * volume, to complement DEXScreener's on-chain pairs in the volume-currents
 * visualization. Not a return of the removed CoinGecko Phase A (coin info,
 * tokenomics, price-change) — this is new, narrower code.
 *
 * `/coins/{platform}/contract/{address}` returns the full coin object by
 * default, which embeds a `tickers` array (same data as the dedicated
 * `/coins/{id}/tickers` endpoint) — so one call covers this, no second
 * request needed. That array mixes CEX and DEX listings; DEX ones are
 * dropped here since DEXScreener already covers those more completely and
 * reliably, and mixing both risks double-counting the same on-chain pair.
 *
 * CoinGecko's tickers carry no buy/sell breakdown for any exchange type —
 * that's a real gap in the data, not something this client should paper
 * over. `buyTxns24h`/`sellTxns24h` are always null here.
 *
 * Docs referenced:
 *   GET https://api.coingecko.com/api/v3/coins/ethereum/contract/{address}
 */

const BASE_URL = "https://api.coingecko.com/api/v3/coins/ethereum/contract";
const MAX_CEX_LISTINGS = 6;

/** Known centralized-exchange slugs, per CoinGecko's `market.identifier`. Anything else (DEX slugs, unrecognized venues) is dropped. */
const CEX_LABELS: Record<string, string> = {
  binance: "Binance",
  binance_us: "Binance.US",
  coinbase_exchange: "Coinbase",
  kucoin: "KuCoin",
  mexc: "MEXC",
  gate: "Gate.io",
  htx: "HTX",
  bybit: "Bybit",
  kraken: "Kraken",
  okx: "OKX",
  bitget: "Bitget",
  crypto_com: "Crypto.com",
};

interface CoinGeckoTicker {
  market?: { identifier?: string };
  converted_volume?: { usd?: number };
  trade_url?: string;
}

interface CoinGeckoContractResponse {
  tickers?: CoinGeckoTicker[];
}

function isConfigured() {
  return Boolean(serverEnv.COINGECKO_API_KEY);
}

export async function getCexTickers(address: string): Promise<ProviderResult<PairVolume[]>> {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };

  const url = `${BASE_URL}/${address}`;
  const result = await fetchJson<CoinGeckoContractResponse>(url, {
    headers: { "x-cg-demo-api-key": serverEnv.COINGECKO_API_KEY },
  });
  if (!result.ok) return result;

  const listings: PairVolume[] = [];
  for (const ticker of result.data.tickers ?? []) {
    const exchangeId = ticker.market?.identifier;
    const label = exchangeId ? CEX_LABELS[exchangeId] : undefined;
    const volumeUsd24h = ticker.converted_volume?.usd;
    if (!exchangeId || !label || !volumeUsd24h || volumeUsd24h <= 0) continue;

    listings.push({
      source: "cex",
      exchangeId,
      label,
      volumeUsd24h,
      buyTxns24h: null,
      sellTxns24h: null,
      pairUrl: ticker.trade_url ?? null,
    });
  }

  if (listings.length === 0) return { ok: false, reason: "not_found" };

  return { ok: true, data: listings.sort((a, b) => b.volumeUsd24h - a.volumeUsd24h).slice(0, MAX_CEX_LISTINGS) };
}
