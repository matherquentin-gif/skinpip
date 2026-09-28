"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/Button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Something went wrong</h1>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        We couldn&apos;t load this page. Try again in a moment.
      </p>
      {error.digest && (
        <p className="font-mono text-[10px]" style={{ color: "var(--text-hint)" }}>Reference: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <Button variant="primary" onClick={() => unstable_retry()}>Try again</Button>
        <Link href="/" className={buttonClasses({ variant: "secondary" })}>Home</Link>
      </div>
    </div>
  );
}
