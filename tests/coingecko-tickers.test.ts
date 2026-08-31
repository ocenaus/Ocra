import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ADDRESS = "0xe172e9b6cfbeeb5593bdce3f077356fdb33af904";

async function loadClient() {
  vi.resetModules();
  return import("@/lib/services/coingecko/client");
}

describe("coingecko client — getCexTickers", () => {
  beforeEach(() => {
    vi.stubEnv("COINGECKO_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns not_configured without calling fetch when no key is set", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("COINGECKO_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { getCexTickers } = await loadClient();
    const result = await getCexTickers(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the demo API key header and the contract address in the URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ tickers: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { getCexTickers } = await loadClient();
    await getCexTickers(ADDRESS);

    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${ADDRESS}`);
    expect((calledInit.headers as Record<string, string>)["x-cg-demo-api-key"]).toBe("test-key");
  });

  it("keeps only known CEX tickers, dropping DEX and unrecognized venues", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          tickers: [
            { market: { identifier: "binance" }, converted_volume: { usd: 500000 }, trade_url: "https://binance.com/x" },
            { market: { identifier: "uniswap_v3" }, converted_volume: { usd: 999999 } },
            { market: { identifier: "some_unlisted_venue" }, converted_volume: { usd: 1000 } },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getCexTickers } = await loadClient();
    const result = await getCexTickers(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([
        {
          source: "cex",
          exchangeId: "binance",
          label: "Binance",
          volumeUsd24h: 500000,
          buyTxns24h: null,
          sellTxns24h: null,
          pairUrl: "https://binance.com/x",
        },
      ]);
    }
  });

  it("sorts by volume descending and caps to the top 6", async () => {
    const cexIds = ["binance", "kucoin", "mexc", "kraken", "okx", "bybit", "bitget"];
    const tickers = cexIds.map((id, i) => ({
      market: { identifier: id },
      converted_volume: { usd: (i + 1) * 1000 },
    }));
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ tickers }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { getCexTickers } = await loadClient();
    const result = await getCexTickers(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(6);
      expect(result.data[0].volumeUsd24h).toBe(7000);
      expect(result.data[5].volumeUsd24h).toBe(2000);
    }
  });

  it("returns not_found when no ticker is on a recognized CEX", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ tickers: [{ market: { identifier: "uniswap_v3" }, converted_volume: { usd: 500 } }] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getCexTickers } = await loadClient();
    const result = await getCexTickers(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_found");
  });

  it("returns not_found when the token has no tickers at all (unlisted on CoinGecko)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { getCexTickers } = await loadClient();
    const result = await getCexTickers(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_found");
  });

  it("returns not_found on an HTTP 404 (unlisted token)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "coin not found" }), { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    const { getCexTickers } = await loadClient();
    const result = await getCexTickers(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_found");
  });
});
