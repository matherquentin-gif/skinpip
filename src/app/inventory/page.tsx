"use client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PipDisplay } from "@/components/ui/PipDisplay";

export default function InventoryPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Inventory</h1>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">Sync Steam inventory</Button>
          <Button variant="primary" size="sm">Deposit skins</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "In custody", value: "0", sub: "items with SkinPip" },
          { label: "Listed", value: "0", sub: "active listings" },
          { label: "Wallet balance", value: "$0.0000", sub: "available" },
          { label: "Pending", value: "$0.0000", sub: "reserved in orders" },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="mt-1 font-mono text-xl font-semibold" style={{ color: "var(--accent)" }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-4 py-12 flex-col text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--bg-elevated)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="var(--text-hint)" strokeWidth="1.5"/>
              <path d="M7 6V5a2 2 0 014 0v1" stroke="var(--text-hint)" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No items in custody</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Sign in with Steam and deposit skins to start trading
            </p>
          </div>
          <Button variant="primary">Sign in with Steam</Button>
        </div>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Wallet</p>
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
