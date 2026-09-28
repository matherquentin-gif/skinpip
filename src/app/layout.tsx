import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { appOrigin } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(appOrigin()),
  title: {
    default: "SkinPip — CS2 Skin Marketplace",
    template: "%s · SkinPip",
  },
  description: "Trade CS2 skins with sub-cent pip precision. No Steam price floor.",
  openGraph: {
    title: "SkinPip",
    description: "Trade CS2 skins below Steam's $0.03 floor. Pip-precise pricing.",
    siteName: "SkinPip",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C1311",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-[var(--radius-sm)] focus:px-3 focus:py-2 focus:text-sm"
          style={{ background: "var(--accent)", color: "var(--on-accent)" }}
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border)] px-4 py-6 text-center text-xs text-[var(--text-hint)]">
          © {new Date().getFullYear()} SkinPip · Not affiliated with Valve Corporation ·{" "}
          <a href="/terms" className="hover:text-[var(--text-muted)]">Terms</a> ·{" "}
          <a href="/privacy" className="hover:text-[var(--text-muted)]">Privacy</a>
        </footer>
      </body>
    </html>
  );
}
