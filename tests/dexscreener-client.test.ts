import { afterEach, describe, expect, it, vi } from "vitest";
import { getMarketData } from "@/lib/services/dexscreener/client";

const ADDRESS = "0xe172e9b6cfbeeb5593bdce3f077356fdb33af904";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("dexscreener client — socials", () => {
  it("extracts website, telegram, and twitter/x from a pair's info block", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          pairs: [
            {
              chainId: "ethereum",
              info: {
                websites: [{ url: "https://example.com" }],
                socials: [
                  { type: "telegram", url: "https://t.me/example" },
                  { type: "twitter", url: "https://twitter.com/example" },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getMarketData(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.socials).toEqual({
        website: "https://example.com",
        telegram: "https://t.me/example",
        twitter: "https://twitter.com/example",
      });
    }
  });

  it("accepts DEXScreener's 'x' social type as Twitter/X", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          pairs: [{ chainId: "ethereum", info: { socials: [{ type: "x", url: "https://x.com/example" }] } }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getMarketData(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.socials.twitter).toBe("https://x.com/example");
  });

  it("ignores pairs on other chains", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          pairs: [{ chainId: "bsc", info: { websites: [{ url: "https://wrong-chain.example" }] } }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getMarketData(ADDRESS);

    expect(result.ok).toBe(false);
  });

  it("returns ok with all-null socials when pairs exist but carry no social info", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ pairs: [{ chainId: "ethereum" }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getMarketData(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.socials).toEqual({ website: null, telegram: null, twitter: null });
      expect(result.data.dexVolume).toEqual([]);
    }
  });

  it("returns not_found when the token has no pairs at all", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ pairs: null }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getMarketData(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_found");
  });

  it("merges info across multiple pairs, filling in whatever the first pair is missing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          pairs: [
            { chainId: "ethereum", info: { websites: [{ url: "https://example.com" }] } },
            { chainId: "ethereum", info: { socials: [{ type: "telegram", url: "https://t.me/example" }] } },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getMarketData(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.socials.website).toBe("https://example.com");
      expect(result.data.socials.telegram).toBe("https://t.me/example");
      expect(result.data.socials.twitter).toBeNull();
    }
  });
});

describe("dexscreener client — dexVolume", () => {
  it("extracts volume and buy/sell txn counts, labeling dexId + labels", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          pairs: [
            {
              chainId: "ethereum",
              dexId: "uniswap",
              labels: ["v3"],
              url: "https://dexscreener.com/ethereum/0xabc",
              volume: { h24: 125000 },
              txns: { h24: { buys: 80, sells: 40 } },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getMarketData(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.dexVolume).toEqual([
        {
          source: "dex",
          exchangeId: "uniswap",
          label: "Uniswap V3",
          volumeUsd24h: 125000,
          buyTxns24h: 80,
          sellTxns24h: 40,
          pairUrl: "https://dexscreener.com/ethereum/0xabc",
        },
      ]);
    }
  });

  it("sorts pairs by volume descending and caps to the top 6", async () => {
    const pairs = Array.from({ length: 9 }, (_, i) => ({
      chainId: "ethereum",
      dexId: `dex${i}`,
      volume: { h24: (i + 1) * 1000 },
      txns: { h24: { buys: 1, sells: 1 } },
    }));
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ pairs }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getMarketData(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.dexVolume).toHaveLength(6);
      expect(result.data.dexVolume[0].volumeUsd24h).toBe(9000);
      expect(result.data.dexVolume[5].volumeUsd24h).toBe(4000);
    }
  });

  it("skips pairs with no dexId or zero/missing 24h volume", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          pairs: [
            { chainId: "ethereum", dexId: "uniswap", volume: { h24: 0 } },
            { chainId: "ethereum", volume: { h24: 500 } },
            { chainId: "ethereum" },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getMarketData(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.dexVolume).toEqual([]);
  });
});
