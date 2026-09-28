import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-mono text-5xl font-semibold" style={{ color: "var(--accent)" }}>404</p>
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Page not found</h1>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        That page or item doesn&apos;t exist. It may have sold or been delisted.
      </p>
      <div className="flex gap-3">
        <Link href="/market" className={buttonClasses({ variant: "primary" })}>Browse market</Link>
        <Link href="/" className={buttonClasses({ variant: "secondary" })}>Home</Link>
      </div>
    </div>
  );
}
