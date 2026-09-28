import type { Metadata } from "next";

// The page is a Client Component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Buy orders",
  description: "Standing CS2 skin bids that fill automatically. Filter by phase, float and unlimited paint seeds.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
