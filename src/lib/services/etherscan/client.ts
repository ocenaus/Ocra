import "server-only";
import { serverEnv } from "@/lib/env";
import { fetchJson, type ProviderResult } from "@/lib/services/http";

/**
 * Etherscan — source-code verification and total supply. This is the only
 * source we use for "is this contract verified" and its source text, which
 * the capability heuristics in `capabilities.ts` scan for mint/burn/pause/
 * blacklist functions. For an unverified contract we deliberately do NOT
 * fall back to bytecode heuristics — we report the capability fields as
 * unknown rather than guess.
 *
 * Uses Etherscan's unified V2 API (a single API key works across chains via
 * `chainid`), which is required for keys issued after Etherscan's V1->V2
 * migration — the old chain-specific V1 endpoint silently rejects those
 * keys with an API-level error wrapped in an HTTP 200, which is why this
 * file treats `status: "0"` as a real failure instead of "not found" (see
 * below).
 *
 * Docs referenced:
 *   GET https://api.etherscan.io/v2/api?chainid=1&module=contract&action=getsourcecode&address={addr}&apikey={key}
 *   GET https://api.etherscan.io/v2/api?chainid=1&module=stats&action=tokensupply&contractaddress={addr}&apikey={key}
 */

const BASE_URL = "https://api.etherscan.io/v2/api";
/** Ethereum Mainnet, per Etherscan V2's chainid parameter. */
const CHAIN_ID = 1;

function isConfigured() {
  return Boolean(serverEnv.ETHERSCAN_API_KEY);
}

/**
 * Etherscan wraps API-level errors (bad key, rate limit, bad params) in an
 * HTTP 200 with `status: "0"`. A *valid* "no verified source" result is
 * also `status` can be "0" on some legacy paths, so the real signal is
 * `message === "NOTOK"` (verified-but-empty-source responses report
 * `message: "OK"`). Missing this distinction is what silently turned real
 * API errors into a misleading "not found" — this classifies the error so
 * callers get an accurate reason instead.
 */
function classifyApiError(message: string | undefined, resultText: string | undefined): ProviderResult<never> {
  const detail = resultText || message || "Unknown Etherscan API error";
  if (/rate limit/i.test(detail)) {
    return { ok: false, reason: "rate_limited", detail };
  }
  return { ok: false, reason: "provider_error", detail };
}

export interface ContractSource {
  isVerified: boolean;
  contractName: string | null;
  sourceCode: string;
  isProxy: boolean;
  implementationAddress: string | null;
}

interface EtherscanSourceResult {
  SourceCode?: string;
  ContractName?: string;
  Proxy?: string;
  Implementation?: string;
}

interface EtherscanSourceResponse {
  status?: string;
  message?: string;
  result?: EtherscanSourceResult[] | string;
}

export async function getContractSource(address: string): Promise<ProviderResult<ContractSource>> {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };

  const url = `${BASE_URL}?chainid=${CHAIN_ID}&module=contract&action=getsourcecode&address=${address}&apikey=${serverEnv.ETHERSCAN_API_KEY}`;
  const result = await fetchJson<EtherscanSourceResponse>(url);
  if (!result.ok) return result;

  if (result.data.message === "NOTOK") {
    return classifyApiError(result.data.message, typeof result.data.result === "string" ? result.data.result : undefined);
  }

  const entry = Array.isArray(result.data.result) ? result.data.result[0] : undefined;
  if (!entry) return { ok: false, reason: "not_found" };

  const sourceCode = entry.SourceCode ?? "";
  const isVerified = sourceCode.trim().length > 0;

  return {
    ok: true,
    data: {
      isVerified,
      contractName: entry.ContractName || null,
      sourceCode,
      isProxy: entry.Proxy === "1",
      implementationAddress: entry.Implementation && entry.Implementation !== "" ? entry.Implementation : null,
    },
  };
}

interface EtherscanCreationResult {
  contractAddress?: string;
  contractCreator?: string;
  txHash?: string;
}

interface EtherscanCreationResponse {
  status?: string;
  message?: string;
  result?: EtherscanCreationResult[] | string;
}

/**
 * The address that deployed the contract. Works for verified and
 * unverified contracts alike (it's from the creation transaction, not the
 * source), but is NOT necessarily "the team" — a launchpad/factory
 * contract commonly shows up here instead of an individual wallet. Callers
 * must label this as "contract creator", never "dev wallet".
 */
export async function getContractCreator(address: string): Promise<ProviderResult<string>> {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };

  const url = `${BASE_URL}?chainid=${CHAIN_ID}&module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${serverEnv.ETHERSCAN_API_KEY}`;
  const result = await fetchJson<EtherscanCreationResponse>(url);
  if (!result.ok) return result;

  if (result.data.message === "NOTOK") {
    return classifyApiError(result.data.message, typeof result.data.result === "string" ? result.data.result : undefined);
  }

  const entry = Array.isArray(result.data.result) ? result.data.result[0] : undefined;
  if (!entry?.contractCreator) return { ok: false, reason: "not_found" };

  return { ok: true, data: entry.contractCreator.toLowerCase() };
}

interface EtherscanSupplyResponse {
  status?: string;
  message?: string;
  result?: string;
}

export async function getTotalSupply(address: string): Promise<ProviderResult<string>> {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };

  const url = `${BASE_URL}?chainid=${CHAIN_ID}&module=stats&action=tokensupply&contractaddress=${address}&apikey=${serverEnv.ETHERSCAN_API_KEY}`;
  const result = await fetchJson<EtherscanSupplyResponse>(url);
  if (!result.ok) return result;

  if (result.data.message === "NOTOK") {
    return classifyApiError(result.data.message, result.data.result);
  }
  if (result.data.status !== "1" || !result.data.result) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, data: result.data.result };
}
