import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getBalance } from "@/lib/ledger";
import { pipsToUSD } from "@/lib/pips";

export async function GET(req: NextRequest) {
  // Auth
  let user;
  try {
    user = await requireUser(req);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }

  const balance = await getBalance(user.id);

  return NextResponse.json({
    balancePips: balance.balancePips.toString(),
    reservedPips: balance.reservedPips.toString(),
    availablePips: balance.availablePips.toString(),
    balanceUsd: pipsToUSD(balance.balancePips),
  });
}
