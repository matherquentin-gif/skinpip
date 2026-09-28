import type { Metadata } from "next";

// The page is a Client Component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Market",
  description: "Browse CS2 skins with pip-precise, sub-cent pricing. Filter by float, phase, paint seed and wear.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
