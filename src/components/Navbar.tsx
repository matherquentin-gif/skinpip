"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { buttonClasses } from "./ui/Button";
import { pipsToSplit } from "@/lib/pips";

const NAV_LINKS = [
  { href: "/market",     label: "Market" },
  { href: "/buy-orders", label: "Buy orders" },
  { href: "/auctions",   label: "Auctions" },
  { href: "/trends",     label: "Trends" },
];

interface WalletState {
  availablePips: bigint | null;
  /** null while the first check is in flight. */
  isLoggedIn: boolean | null;
}

function NavLinks({ pathname, className }: { pathname: string; className: string }) {
  return (
    <nav aria-label="Main" className={className}>
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "shrink-0 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm transition-colors",
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
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [wallet, setWallet] = useState<WalletState>({ availablePips: null, isLoggedIn: null });

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/wallet/balance", { signal: ctrl.signal })
      .then(async (res) => {
        if (res.status === 401) {
          setWallet({ availablePips: null, isLoggedIn: false });
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setWallet({ availablePips: BigInt(data.availablePips), isLoggedIn: true });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        // Don't leave the loading placeholder up forever when the balance
        // endpoint fails (e.g. the database is unreachable).
        setWallet((w) => (w.isLoggedIn === null ? { availablePips: null, isLoggedIn: false } : w));
      });
    return () => ctrl.abort();
  }, [pathname]);

  const split = wallet.availablePips != null ? pipsToSplit(wallet.availablePips) : null;

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--border)]"
      style={{ background: "var(--bg-app)" }}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="SkinPip home">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "var(--accent)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 2 L14 6 L14 10 L8 14 L2 10 L2 6 Z" stroke="var(--on-accent)" strokeWidth="1.5" fill="none"/>
              <circle cx="8" cy="8" r="2" fill="var(--on-accent)"/>
            </svg>
          </span>
          <span className="text-base font-semibold tracking-tight" aria-hidden>
            skin<span style={{ color: "var(--accent)" }}>pip</span>
          </span>
        </Link>

        <NavLinks pathname={pathname} className="hidden items-center gap-1 md:flex" />

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {wallet.isLoggedIn === true && (
            <Link
              href="/inventory"
              title="Available balance"
              className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-2.5 py-1.5 font-mono text-sm hover:border-[var(--accent)]"
              style={{ background: "var(--bg-surface)" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <rect x="1" y="3" width="12" height="9" rx="2" stroke="var(--accent)" strokeWidth="1.3"/>
                <path d="M10 7H14" stroke="var(--accent)" strokeWidth="1.3"/>
                <circle cx="11.5" cy="7" r="1" fill="var(--accent)"/>
              </svg>
              <span className="sr-only">Available balance: </span>
              {split ? (
                <span style={{ color: "var(--text-primary)" }}>
                  {split.whole}<span style={{ color: "var(--accent)" }}>{split.sub}</span>
                </span>
              ) : (
                <span style={{ color: "var(--text-hint)" }}>$0.<span style={{ color: "var(--accent)" }}>0000</span></span>
              )}
            </Link>
          )}

          {wallet.isLoggedIn === true && (
            <>
              <Link href="/inventory" className={buttonClasses({ variant: "ghost", size: "sm" }, "hidden sm:inline-flex")}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <rect x="2" y="4" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                Inventory
              </Link>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className={buttonClasses({ variant: "ghost", size: "sm" })}>
                  Sign out
                </button>
              </form>
            </>
          )}

          {wallet.isLoggedIn === false && (
            // Plain <a>: this is an API route that redirects to Steam, not a
            // page, so client-side navigation and prefetching don't apply.
            <a href="/api/auth/steam" className={buttonClasses({ variant: "primary", size: "sm" })}>
              <span className="sm:hidden">Sign in</span>
              <span className="hidden sm:inline">Sign in with Steam</span>
            </a>
          )}

          {wallet.isLoggedIn === null && (
            <div aria-hidden className="h-8 w-28 animate-pulse rounded-[var(--radius-md)]" style={{ background: "var(--bg-elevated)" }} />
          )}
        </div>
      </div>

      {/* Small screens: the section links get their own scrollable row. */}
      <NavLinks
        pathname={pathname}
        className="flex items-center gap-1 overflow-x-auto border-t border-[var(--border)] px-4 py-1.5 md:hidden"
      />
    </header>
  );
}
