// The SkinPip hexagon mark as a standalone element for generated images
// (app icons). Inline styles only: next/og renders without our CSS.

export function BrandMark({ size, radius }: { size: number; radius: number }) {
  const glyph = Math.round(size * 0.6);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#25E59A",
        borderRadius: radius,
      }}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 16 16" fill="none">
        <path d="M8 2 L14 6 L14 10 L8 14 L2 10 L2 6 Z" stroke="#06231A" strokeWidth="1.5" fill="none" />
        <circle cx="8" cy="8" r="2" fill="#06231A" />
      </svg>
    </div>
  );
}
