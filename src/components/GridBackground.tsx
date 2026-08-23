"use client";

import PixelBlast from "./PixelBlast";

/**
 * A fullscreen interactive pixel-blast background layer.
 *
 * Renders behind all page content with a dark gradient overlay
 * so the theme remains intact. The pixel pattern reacts to mouse movement —
 * a subtle, tactile background effect using the amber accent color.
 *
 * Sits at z-0 between the body fallback background and page content.
 * Page content (rendered later in DOM) stacks naturally on top.
 */
export default function GridBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* PixelBlast layer */}
      <PixelBlast
        variant="circle"
        pixelSize={6}
        color="#EAB308"
        patternScale={3}
        patternDensity={1.2}
        pixelSizeJitter={0.5}
        enableRipples
        rippleSpeed={0.4}
        rippleThickness={0.12}
        rippleIntensityScale={1.5}
        liquid
        liquidStrength={0.12}
        liquidRadius={1.2}
        liquidWobbleSpeed={5}
        speed={0.6}
        edgeFade={0.25}
        transparent
        className="absolute inset-0"
      />

      {/* Light gradient overlay — tint only, keeps content visible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(9,9,11,0.7) 0%, rgba(9,9,11,0.8) 50%, rgba(9,9,11,0.9) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.3) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
