import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SkinPip — CS2 Skin Marketplace",
  description: "Trade CS2 skins with sub-cent pip precision. No Steam price floor.",
  openGraph: {
    title: "SkinPip",
    description: "Trade CS2 skins below Steam's $0.03 floor. Pip-precise pricing.",
    siteName: "SkinPip",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--text-hint)]">
          © {new Date().getFullYear()} SkinPip · Not affiliated with Valve Corporation ·{" "}
          <a href="/terms" className="hover:text-[var(--text-muted)]">Terms</a> ·{" "}
          <a href="/privacy" className="hover:text-[var(--text-muted)]">Privacy</a>
        </footer>
      </body>
    </html>
  );
}
