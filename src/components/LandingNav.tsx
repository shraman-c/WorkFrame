"use client";

import Link from "next/link";

/* ──────────────────────────────────────────────────────────────────────────
 * LandingNav — marketing navigation for logged-out visitors
 *
 * Visually consistent with the authenticated app's Navbar but functionally
 * separate: no tabs, no notification bell, no avatar dropdown.
 * Two items top-right: "Sign In" (quiet text link) + "Get Started" (solid
 * accent primary button, visually heavier).
 * Uses sharp-ish corners (rounded-md = 6px) matching the design system.
 * ────────────────────────────────────────────────────────────────────────── */

export default function LandingNav() {
  return (
    <nav className="relative z-20" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
        {/* Logo — left */}
        <Link href="/" className="shrink-0 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-accent" />
          <span className="font-heading text-lg font-bold tracking-tight text-foreground-primary uppercase">
            WorkFrame
          </span>
        </Link>

        {/* Right side — Sign In + Get Started */}
        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="text-sm font-medium text-foreground-secondary hover:text-foreground-primary transition-colors duration-200"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 text-sm font-semibold bg-accent text-surface-base rounded-md hover:bg-accent-hover transition-colors duration-200"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
