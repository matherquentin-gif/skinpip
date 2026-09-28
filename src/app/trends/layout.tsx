import type { Metadata } from "next";

// The page is a Client Component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Trends",
  description: "CS2 skin market cap, category indices, and the top gainers and losers.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
