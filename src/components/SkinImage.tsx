import Image from "next/image";
import { clsx } from "clsx";

interface SkinImageProps {
  src: string | null;
  alt: string;
  /** Sizes the image box (e.g. "h-28 w-full"); the render is contained within it. */
  className?: string;
  /** Load immediately: for above-the-fold images such as the first grid row. */
  eager?: boolean;
}

/**
 * A CS2 item render from Steam's CDN, or a placeholder when there isn't one.
 *
 * `unoptimized` serves Steam's image directly: the renders are already small,
 * and it keeps Vercel image-optimization usage at zero. next/image still gives
 * us lazy loading and a reserved box (no layout shift). Drop `unoptimized` to
 * enable resizing; the hosts are allowed in next.config.ts.
 */
export function SkinImage({ src, alt, className, eager }: SkinImageProps) {
  if (!src) {
    return (
      <div className={clsx("flex items-center justify-center text-xs text-[var(--text-hint)]", className)}>
        No image
      </div>
    );
  }
  return (
    <div className={clsx("relative", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className="object-contain"
      />
    </div>
  );
}
