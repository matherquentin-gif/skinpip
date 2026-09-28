import type { MetadataRoute } from "next";
import { appOrigin } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appOrigin();
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/market`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/auctions`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${base}/buy-orders`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${base}/trends`, changeFrequency: "daily", priority: 0.6 },
  ];
}
