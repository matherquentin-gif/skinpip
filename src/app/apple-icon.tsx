import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/BrandMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS applies its own rounded mask, so the square stays square.
export default function AppleIcon() {
  return new ImageResponse(<BrandMark size={size.width} radius={0} />, { ...size });
}
