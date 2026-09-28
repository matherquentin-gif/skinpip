import type { Metadata } from "next";

// The page is a Client Component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Auctions",
  description: "Timed CS2 skin auctions with anti-snipe protection and sub-cent bid increments.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
