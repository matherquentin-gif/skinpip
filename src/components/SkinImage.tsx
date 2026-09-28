import Image from "next/image";
import { clsx } from "clsx";

interface SkinImageProps {
  src: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Load eagerly (use for the main above-the-fold image only). */
  priority?: boolean;
}

/**
 * A CS2 item render from Steam's CDN, or a placeholder when there isn't one.
 *
 * `unoptimized` serves Steam's image directly: the renders are already small,
 * and it keeps Vercel image-optimization usage at zero. next/image still gives
 * us lazy loading and reserved dimensions (no layout shift). Drop
 * `unoptimized` to enable resizing; the hosts are allowed in next.config.ts.
 */
export function SkinImage({ src, alt, width, height, className, priority }: SkinImageProps) {
  if (!src) {
    return (
      <div className={clsx("flex items-center justify-center text-xs text-[var(--text-hint)]", className)}>
        No image
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      priority={priority}
      className={clsx("object-contain", className)}
    />
  );
}
