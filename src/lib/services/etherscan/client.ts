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
 * Docs referenced:
 *   GET https://api.etherscan.io/api?module=contract&action=getsourcecode&address={addr}&apikey={key}
 *   GET https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress={addr}&apikey={key}
 */

const BASE_URL = "https://api.etherscan.io/api";

function isConfigured() {
  return Boolean(serverEnv.ETHERSCAN_API_KEY);
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

  const url = `${BASE_URL}?module=contract&action=getsourcecode&address=${address}&apikey=${serverEnv.ETHERSCAN_API_KEY}`;
  const result = await fetchJson<EtherscanSourceResponse>(url);
  if (!result.ok) return result;

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

interface EtherscanSupplyResponse {
  status?: string;
  result?: string;
}

export async function getTotalSupply(address: string): Promise<ProviderResult<string>> {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };

  const url = `${BASE_URL}?module=stats&action=tokensupply&contractaddress=${address}&apikey=${serverEnv.ETHERSCAN_API_KEY}`;
  const result = await fetchJson<EtherscanSupplyResponse>(url);
  if (!result.ok) return result;

  if (result.data.status !== "1" || !result.data.result) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, data: result.data.result };
}
