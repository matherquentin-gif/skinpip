import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy.
//
// We use a header-based (non-nonce) policy on purpose: a nonce-based CSP would
// force every page into dynamic rendering and, because the UI relies on inline
// `style={{}}` attributes, would still need 'unsafe-inline' for styles. Since
// the app has no XSS sinks (no dangerouslySetInnerHTML / eval, React escapes by
// default), this policy focuses on the high-value protections that DON'T break
// the app: locking the origin down, blocking framing/clickjacking, forbidding
// plugins and <base> hijacking, and forcing HTTPS. 'unsafe-eval' is dev-only
// (React Refresh needs it); production gets the stricter policy.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://*.steamstatic.com https://*.akamaihd.net`,
  `font-src 'self'`,
  `connect-src 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self' https://steamcommunity.com`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join("; ");

// Static security headers applied to every response.
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Force HTTPS for two years, including subdomains.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Defence-in-depth against clickjacking (CSP frame-ancestors is the primary).
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers MIME-sniffing responses into a different content type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs (which may carry ids) to other origins.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Drop powerful APIs the app never uses.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "steamcdn-a.akamaihd.net" },
      { protocol: "https", hostname: "community.cloudflare.steamstatic.com" },
      { protocol: "https", hostname: "community.akamai.steamstatic.com" },
      { protocol: "https", hostname: "avatars.steamstatic.com" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["skinpip.com", "localhost:3000"] },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
