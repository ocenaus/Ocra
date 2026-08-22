import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * These tests mock `fetch` to simulate real Etherscan API responses,
 * because a real bug shipped here: an HTTP 200 response can still carry an
 * API-level error (`message: "NOTOK"`, e.g. for an API key that's V2-only)
 * that earlier code silently treated as "not found" instead of "the call
 * actually failed". Every case below is taken from Etherscan's real
 * response shapes.
 */

const ADDRESS = "0xe172e9b6cfbeeb5593bdce3f077356fdb33af904";

async function loadClient() {
  vi.resetModules();
  return import("@/lib/services/etherscan/client");
}

describe("etherscan client", () => {
  beforeEach(() => {
    vi.stubEnv("ETHERSCAN_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("uses the V2 unified endpoint with chainid=1, not the legacy V1 URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "1", message: "OK", result: [{ SourceCode: "" }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getContractSource } = await loadClient();
    await getContractSource(ADDRESS);

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("https://api.etherscan.io/v2/api");
    expect(calledUrl).toContain("chainid=1");
    expect(calledUrl).not.toMatch(/^https:\/\/api\.etherscan\.io\/api\?/);
  });

  it("treats an API-level error (status 0, message NOTOK) as a real failure, not 'not found'", async () => {
    // Real Etherscan response for a V2-only key hitting a misconfigured request.
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "0", message: "NOTOK", result: "Invalid API Key" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getContractSource } = await loadClient();
    const result = await getContractSource(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).not.toBe("not_found");
      expect(result.detail).toContain("Invalid API Key");
    }
  });

  it("classifies a rate-limit error response distinctly", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "0", message: "NOTOK", result: "Max rate limit reached" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getContractSource } = await loadClient();
    const result = await getContractSource(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rate_limited");
  });

  it("parses a verified contract response correctly", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "1",
          message: "OK",
          result: [
            {
              SourceCode: "contract Foo { function mint(address to, uint256 amount) public onlyOwner {} }",
              ContractName: "Foo",
              Proxy: "0",
              Implementation: "",
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getContractSource } = await loadClient();
    const result = await getContractSource(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.isVerified).toBe(true);
      expect(result.data.contractName).toBe("Foo");
      expect(result.data.isProxy).toBe(false);
    }
  });

  it("treats an empty SourceCode with message OK as legitimately unverified, not an error", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ status: "1", message: "OK", result: [{ SourceCode: "", ContractName: "" }] }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getContractSource } = await loadClient();
    const result = await getContractSource(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.isVerified).toBe(false);
  });

  it("parses a proxy contract's implementation address", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "1",
          message: "OK",
          result: [
            {
              SourceCode: "contract Proxy {}",
              ContractName: "Proxy",
              Proxy: "1",
              Implementation: "0x1111111111111111111111111111111111111111",
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getContractSource } = await loadClient();
    const result = await getContractSource(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.isProxy).toBe(true);
      expect(result.data.implementationAddress).toBe("0x1111111111111111111111111111111111111111");
    }
  });

  it("returns not_configured when no API key is set, without calling fetch", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("ETHERSCAN_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { getContractSource } = await loadClient();
    const result = await getContractSource(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("getTotalSupply also treats a NOTOK response as a real failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "0", message: "NOTOK", result: "Invalid API Key" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getTotalSupply } = await loadClient();
    const result = await getTotalSupply(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).not.toBe("not_found");
  });

  it("getTotalSupply parses a successful response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "1", message: "OK", result: "1000000000000000000000000" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getTotalSupply } = await loadClient();
    const result = await getTotalSupply(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBe("1000000000000000000000000");
  });

  it("getContractCreator parses the deployer address and normalizes it to lowercase", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "1",
          message: "OK",
          result: [
            {
              contractAddress: ADDRESS,
              contractCreator: "0xABCDEF0123456789ABCDEF0123456789ABCDEF01",
              txHash: "0xdeadbeef",
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getContractCreator } = await loadClient();
    const result = await getContractCreator(ADDRESS);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBe("0xabcdef0123456789abcdef0123456789abcdef01");
  });

  it("getContractCreator uses the V2 endpoint with the getcontractcreation action", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ status: "1", message: "OK", result: [{ contractCreator: "0x1111111111111111111111111111111111111111" }] }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getContractCreator } = await loadClient();
    await getContractCreator(ADDRESS);

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("action=getcontractcreation");
    expect(calledUrl).toContain("chainid=1");
  });

  it("getContractCreator treats a NOTOK response as a real failure, not not_found", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "0", message: "NOTOK", result: "Invalid API Key" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getContractCreator } = await loadClient();
    const result = await getContractCreator(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).not.toBe("not_found");
  });

  it("getContractCreator returns not_configured without calling fetch when no key is set", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("ETHERSCAN_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { getContractCreator } = await loadClient();
    const result = await getContractCreator(ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
