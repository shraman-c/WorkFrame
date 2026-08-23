"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ──────────────────────────────────────────────────────────────────────────
 * RollingText — scroll-triggered center-out character stagger reveal
 *
 * Splits the given text into individual characters, each wrapped in an
 * overflow:hidden mask span. On scroll entry, characters animate from
 * below (yPercent: 110 → 0, opacity: 0 → 1) with a center-out stagger
 * so the animation ripples outward from the middle character.
 *
 * Respects prefers-reduced-motion: renders text fully visible, no animation.
 * ────────────────────────────────────────────────────────────────────────── */

interface RollingTextProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  charClassName?: string;
  staggerEach?: number;
  duration?: number;
}

// All valid Tag element types extend HTMLElement. The ref is only used
// for querySelectorAll on children, so the concrete subtype doesn't matter.
type TagRef = HTMLElement;

export default function RollingText({
  text,
  as: Tag = "h2",
  className = "",
  charClassName = "",
  staggerEach = 0.03,
  duration = 0.7,
}: RollingTextProps) {
  const containerRef = useRef<TagRef>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const chars = el.querySelectorAll<HTMLElement>(".rt-char");
    if (chars.length === 0) return;

    gsap.set(chars, { yPercent: 110, opacity: 0 });

    const ctx = gsap.context(() => {
      gsap.to(chars, {
        yPercent: 0,
        opacity: 1,
        duration,
        ease: "power3.out",
        stagger: {
          each: staggerEach,
          from: "center",
        },
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    });

    return () => ctx.revert();
  }, [text, staggerEach, duration]);

  return (
    <Tag ref={containerRef as never} className={className} aria-label={text}>
      {Array.from(text).map((char, i) => (
        <span
          key={`${char}-${i}`}
          className={`rt-char inline-block overflow-hidden ${charClassName}`}
          style={{ whiteSpace: char === " " ? "pre" : undefined }}
          aria-hidden="true"
        >
          <span className="inline-block">{char}</span>
        </span>
      ))}
    </Tag>
  );
}
