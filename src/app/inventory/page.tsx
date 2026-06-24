import { cookies } from "next/headers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PipDisplay } from "@/components/ui/PipDisplay";
import { pipsToUSD } from "@/lib/pips";
import { verifySessionToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBalance } from "@/lib/ledger";

async function getInventoryData(userId: string) {
  const [items, listings, balance] = await Promise.all([
    db.item.count({ where: { ownerId: userId, settlementType: { in: ["BOT_CUSTODY", "P2P_DIRECT"] } } }),
    db.listing.count({ where: { sellerId: userId, status: "ACTIVE" } }),
    getBalance(userId),
  ]);
  return { items, listings, balance };
}

export default async function InventoryPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("sp_session")?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken) : null;

  if (!session) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <Card>
          <div className="flex items-center gap-4 py-16 flex-col text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "var(--bg-elevated)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="8" r="4" stroke="var(--text-hint)" strokeWidth="1.5" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="var(--text-hint)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Sign in to view your inventory
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Connect your Steam account to deposit skins, manage listings, and trade.
              </p>
            </div>
            <a href="/api/auth/steam">
              <Button variant="primary" size="lg">Sign in with Steam</Button>
            </a>
          </div>
        </Card>
      </div>
    );
  }

  const { items, listings, balance } = await getInventoryData(session.userId);

  const stats = [
    { label: "In custody", value: String(items), sub: "items with SkinPip" },
    { label: "Listed", value: String(listings), sub: "active listings" },
    { label: "Available balance", value: pipsToUSD(balance.availablePips), sub: "ready to use" },
    { label: "Reserved", value: pipsToUSD(balance.reservedPips), sub: "in orders & bids" },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Inventory
        </h1>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">Sync Steam inventory</Button>
          <Button variant="primary" size="sm">Deposit skins</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="mt-1 font-mono text-xl font-semibold" style={{ color: "var(--accent)" }}>
              {s.value}
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      {items === 0 ? (
        <Card>
          <div className="flex items-center gap-4 py-12 flex-col text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--bg-elevated)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="var(--text-hint)" strokeWidth="1.5" />
                <path d="M7 6V5a2 2 0 014 0v1" stroke="var(--text-hint)" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                No items in custody
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Deposit skins from your Steam inventory to list them for sale or bid.
              </p>
            </div>
            <Button variant="primary">Deposit skins</Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <p className="mb-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Wallet</p>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total balance</p>
            <PipDisplay pips={balance.balancePips} size="xl" />
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Available</p>
            <PipDisplay pips={balance.availablePips} size="lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Deposit</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1">Card (Stripe)</Button>
              <Button variant="secondary" size="sm" className="flex-1">Crypto</Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Withdraw</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1">Bank / card</Button>
              <Button variant="secondary" size="sm" className="flex-1">Crypto</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
