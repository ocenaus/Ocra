import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ADDRESS = "0xe172e9b6cfbeeb5593bdce3f077356fdb33af904";

async function loadClient() {
  vi.resetModules();
  return import("@/lib/services/coingecko/client");
}

describe("coingecko client", () => {
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

    const { getTokenData } = await loadClient();
    const result = await getTokenData(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the demo API key header and the contract address in the URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { getTokenData } = await loadClient();
    await getTokenData(ADDRESS);

    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain(`/coins/ethereum/contract/${ADDRESS}`);
    expect(calledUrl).toContain("price_change_percentage=1h%2C24h%2C7d%2C14d%2C30d%2C1y");
    expect((calledInit.headers as Record<string, string>)["x-cg-demo-api-key"]).toBe("test-key");
  });

  it("returns not_found when the response has no coin id (token isn't listed on CoinGecko)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { getTokenData } = await loadClient();
    const result = await getTokenData(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_found");
  });

  it("returns not_found on an HTTP 404 (unlisted token)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "coin not found" }), { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    const { getTokenData } = await loadClient();
    const result = await getTokenData(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_found");
  });

  it("classifies an HTTP 429 as rate_limited", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);

    const { getTokenData } = await loadClient();
    const result = await getTokenData(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rate_limited");
  });

  it("parses price change percentages, tokenomics, categories, links, and chains from a full response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "example-token",
          categories: ["Meme", "Ethereum Ecosystem", null],
          platforms: { ethereum: ADDRESS, "binance-smart-chain": "0xabc123", "": "0xshouldbeignored" },
          links: {
            homepage: ["https://example.com", ""],
            blockchain_site: ["https://etherscan.io/token/0x1", "", "https://etherscan.io/token/0x1"],
            twitter_screen_name: "exampletoken",
            telegram_channel_identifier: "exampletoken",
            subreddit_url: "https://reddit.com/r/exampletoken",
            repos_url: { github: ["https://github.com/example/token"] },
          },
          market_data: {
            market_cap: { usd: 123_000_000 },
            fully_diluted_valuation: { usd: 456_000_000 },
            total_volume: { usd: 7_800_000 },
            circulating_supply: 900_000_000,
            total_supply: 1_000_000_000,
            max_supply: 1_000_000_000,
            price_change_percentage_1h_in_currency: { usd: 0.5 },
            price_change_percentage_24h_in_currency: { usd: -3.2 },
            price_change_percentage_7d_in_currency: { usd: 12.1 },
            price_change_percentage_14d_in_currency: { usd: -1.1 },
            price_change_percentage_30d_in_currency: { usd: 40.4 },
            price_change_percentage_1y_in_currency: { usd: 200.9 },
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getTokenData } = await loadClient();
    const result = await getTokenData(ADDRESS);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.priceChange).toEqual({ h1: 0.5, h24: -3.2, d7: 12.1, d14: -1.1, d30: 40.4, y1: 200.9 });

    expect(result.data.tokenomics).toEqual({
      circulatingSupply: 900_000_000,
      totalSupply: 1_000_000_000,
      maxSupply: 1_000_000_000,
      marketCapUsd: 123_000_000,
      fullyDilutedValuationUsd: 456_000_000,
      volume24hUsd: 7_800_000,
    });

    expect(result.data.info.coingeckoId).toBe("example-token");
    expect(result.data.info.categories).toEqual(["Meme", "Ethereum Ecosystem"]);
    expect(result.data.info.chains).toEqual([
      { platform: "ethereum", contractAddress: ADDRESS },
      { platform: "binance-smart-chain", contractAddress: "0xabc123" },
    ]);
    expect(result.data.info.links).toEqual({
      website: "https://example.com",
      explorers: ["https://etherscan.io/token/0x1"],
      twitter: "https://x.com/exampletoken",
      telegram: "https://t.me/exampletoken",
      reddit: "https://reddit.com/r/exampletoken",
      github: "https://github.com/example/token",
    });
  });

  it("leaves community links null when CoinGecko doesn't have them, rather than guessing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "example-token",
          categories: [],
          platforms: { ethereum: ADDRESS },
          links: {},
          market_data: { market_cap: { usd: 1 } },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getTokenData } = await loadClient();
    const result = await getTokenData(ADDRESS);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.info.links).toEqual({
      website: null,
      explorers: [],
      twitter: null,
      telegram: null,
      reddit: null,
      github: null,
    });
  });
});
