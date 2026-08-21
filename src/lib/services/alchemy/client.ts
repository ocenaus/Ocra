import "server-only";
import { serverEnv } from "@/lib/env";
import { fetchJson, type ProviderResult } from "@/lib/services/http";
import type { TokenMetadata, TokenPrice } from "@/lib/services/types";

/**
 * Alchemy — used as a metadata/price supplement, not for holders. Alchemy
 * has no general "top holders for an arbitrary ERC-20" endpoint, so Moralis
 * is the source of truth for that (see moralis/client.ts).
 *
 * Docs referenced (field presence may drift with API versions — every read
 * here falls back to null rather than assuming a shape):
 *   POST https://eth-mainnet.g.alchemy.com/v2/{key}  method: alchemy_getTokenMetadata
 *   POST https://api.g.alchemy.com/prices/v1/{key}/tokens/by-address
 */

function isConfigured() {
  return Boolean(serverEnv.ALCHEMY_API_KEY);
}

interface AlchemyMetadataResponse {
  result?: {
    name?: string | null;
    symbol?: string | null;
    decimals?: number | null;
    logo?: string | null;
  };
  error?: { message?: string };
}

export async function getTokenMetadata(address: string): Promise<ProviderResult<TokenMetadata>> {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };

  const url = `https://eth-mainnet.g.alchemy.com/v2/${serverEnv.ALCHEMY_API_KEY}`;
  const result = await fetchJson<AlchemyMetadataResponse>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getTokenMetadata",
      params: [address],
    }),
  });
  if (!result.ok) return result;
  if (result.data.error) return { ok: false, reason: "provider_error", detail: result.data.error.message };

  const meta = result.data.result;
  if (!meta) return { ok: false, reason: "not_found" };

  return {
    ok: true,
    data: {
      address,
      name: meta.name ?? null,
      symbol: meta.symbol ?? null,
      decimals: typeof meta.decimals === "number" ? meta.decimals : null,
      logoUrl: meta.logo ?? null,
      totalSupplyRaw: null,
    },
  };
}

interface AlchemyPriceResponse {
  data?: Array<{
    address?: string;
    prices?: Array<{ currency?: string; value?: string }>;
    error?: string;
  }>;
}

export async function getTokenPrice(address: string): Promise<ProviderResult<TokenPrice>> {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };

  const url = `https://api.g.alchemy.com/prices/v1/${serverEnv.ALCHEMY_API_KEY}/tokens/by-address`;
  const result = await fetchJson<AlchemyPriceResponse>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ addresses: [{ network: "eth-mainnet", address }] }),
  });
  if (!result.ok) return result;

  const entry = result.data.data?.[0];
  const usdEntry = entry?.prices?.find((p) => p.currency === "usd");
  const usdPrice = usdEntry?.value ? Number(usdEntry.value) : null;

  if (usdPrice === null || !Number.isFinite(usdPrice)) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, data: { usdPrice, source: "alchemy" } };
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
/** 4-byte selector for `owner()`, the standard Ownable getter. */
const OWNER_SELECTOR = "0x8da5cb5b";

interface AlchemyRpcResponse {
  result?: string;
  error?: { message?: string };
}

/**
 * Best-effort on-chain read of `owner()`. Only meaningful for contracts that
 * implement the common Ownable pattern — a revert or garbage return just
 * means "unknown", not "no owner". A returned zero address means ownership
 * has been renounced.
 */
export async function getContractOwner(
  address: string,
): Promise<ProviderResult<{ ownerAddress: string | null; isRenounced: boolean }>> {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };

  const url = `https://eth-mainnet.g.alchemy.com/v2/${serverEnv.ALCHEMY_API_KEY}`;
  const result = await fetchJson<AlchemyRpcResponse>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_call",
      params: [{ to: address, data: OWNER_SELECTOR }, "latest"],
    }),
  });
  if (!result.ok) return result;
  if (result.data.error || !result.data.result || result.data.result === "0x") {
    return { ok: false, reason: "not_found" };
  }

  // Return data is a 32-byte word; the address is the low 20 bytes.
  const hex = result.data.result;
  const ownerAddress = `0x${hex.slice(-40)}`.toLowerCase();

  return {
    ok: true,
    data: {
      ownerAddress: ownerAddress === ZERO_ADDRESS ? null : ownerAddress,
      isRenounced: ownerAddress === ZERO_ADDRESS,
    },
  };
}
