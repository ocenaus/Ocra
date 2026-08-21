import { NextResponse } from "next/server";
import { isValidEthereumAddress, normalizeAddress } from "@/lib/validation/ethereum";
import { getTokenDetails, getTokenHolders } from "@/lib/services/token";

const MAX_LIMIT = 100;

export async function GET(request: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address: raw } = await params;
  const address = decodeURIComponent(raw);

  if (!isValidEthereumAddress(address)) {
    return NextResponse.json({ error: "Invalid Ethereum address." }, { status: 400 });
  }

  const normalized = normalizeAddress(address);
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : MAX_LIMIT;

  // Total supply/decimals let us compute % of supply if a provider doesn't
  // return it directly. Pass them via query params to avoid a redundant
  // metadata fetch when the caller already has them from /api/token/[address].
  let totalSupplyRaw = searchParams.get("totalSupply");
  const decimalsParam = searchParams.get("decimals");
  let decimals = decimalsParam !== null ? Number(decimalsParam) : null;

  if (totalSupplyRaw === null || decimals === null || !Number.isFinite(decimals)) {
    const details = await getTokenDetails(normalized);
    totalSupplyRaw = details.metadata.totalSupplyRaw;
    decimals = details.metadata.decimals;
  }

  const { holders, gaps } = await getTokenHolders(normalized, totalSupplyRaw, decimals, limit);

  return NextResponse.json(
    { holders, totalHoldersReturned: holders.length, dataGaps: gaps },
    { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=120" } },
  );
}
