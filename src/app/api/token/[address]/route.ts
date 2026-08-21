import { NextResponse } from "next/server";
import { isValidEthereumAddress, normalizeAddress } from "@/lib/validation/ethereum";
import { getTokenDetails } from "@/lib/services/token";

export async function GET(_request: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address: raw } = await params;
  const address = decodeURIComponent(raw);

  if (!isValidEthereumAddress(address)) {
    return NextResponse.json({ error: "Invalid Ethereum address." }, { status: 400 });
  }

  const details = await getTokenDetails(normalizeAddress(address));

  return NextResponse.json(details, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
  });
}
