import { afterEach, describe, expect, it, vi } from "vitest";
import { getTokenSocials } from "@/lib/services/dexscreener/client";

const ADDRESS = "0xe172e9b6cfbeeb5593bdce3f077356fdb33af904";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("dexscreener client", () => {
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

    const result = await getTokenSocials(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
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

    const result = await getTokenSocials(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.twitter).toBe("https://x.com/example");
  });

  it("ignores pairs on other chains", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          pairs: [
            { chainId: "bsc", info: { websites: [{ url: "https://wrong-chain.example" }] } },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getTokenSocials(ADDRESS);

    expect(result.ok).toBe(false);
  });

  it("returns not_found when no pair has any social info", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ pairs: [{ chainId: "ethereum" }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getTokenSocials(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_found");
  });

  it("returns not_found when the token has no pairs at all", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ pairs: null }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getTokenSocials(ADDRESS);

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

    const result = await getTokenSocials(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.website).toBe("https://example.com");
      expect(result.data.telegram).toBe("https://t.me/example");
      expect(result.data.twitter).toBeNull();
    }
  });
});
