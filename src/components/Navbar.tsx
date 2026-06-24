"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Button } from "./ui/Button";

const NAV_LINKS = [
  { href: "/market",    label: "Market" },
  { href: "/buy-orders", label: "Buy orders" },
  { href: "/auctions",  label: "Auctions" },
  { href: "/trends",    label: "Trends" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--border)]"
      style={{ background: "var(--bg-app)" }}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#06231A]"
            style={{ background: "var(--accent)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 2 L14 6 L14 10 L8 14 L2 10 L2 6 Z" stroke="#06231A" strokeWidth="1.5" fill="none"/>
              <circle cx="8" cy="8" r="2" fill="#06231A"/>
            </svg>
          </span>
          <span className="text-base font-semibold tracking-tight">
            skin<span style={{ color: "var(--accent)" }}>pip</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-[var(--radius-sm)] px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div
            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-1.5 font-mono text-sm"
            style={{ background: "var(--bg-surface)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <rect x="1" y="3" width="12" height="9" rx="2" stroke="var(--accent)" strokeWidth="1.3"/>
              <path d="M10 7H14" stroke="var(--accent)" strokeWidth="1.3"/>
              <circle cx="11.5" cy="7" r="1" fill="var(--accent)"/>
            </svg>
            <span style={{ color: "var(--text-primary)" }}>$0.<span style={{ color: "var(--accent)" }}>0000</span></span>
          </div>

          <Link href="/inventory">
            <Button variant="ghost" size="sm" className="gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <rect x="2" y="4" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M5 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              Inventory
            </Button>
          </Link>

          <Link href="/api/auth/steam">
            <Button variant="primary" size="sm">
              Sign in with Steam
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
