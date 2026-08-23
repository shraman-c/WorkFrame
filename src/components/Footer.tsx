"use client";

/* ──────────────────────────────────────────────────────────────────────────
 * Footer — shared sitewide footer
 *
 * Visually quiet: solid dark background, small text, thin top border.
 * Appears on every page via root layout.
 * Uses the same design system tokens: surface-* colors, accent, sharp corners.
 * ────────────────────────────────────────────────────────────────────────── */

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-surface-border bg-surface-base">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Left — wordmark + tagline + copyright */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-sm bg-accent" />
              <span className="font-heading text-sm font-bold tracking-tight text-foreground-primary uppercase">
                WorkFrame
              </span>
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Human resource management, built for focus.
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              &copy; {year} WorkFrame. All rights reserved.
            </p>
          </div>

          {/* Right — links */}
          <nav
            className="flex items-center gap-6 text-xs text-foreground-muted"
            aria-label="Footer navigation"
          >
            <span className="cursor-default">
              Privacy Policy <span className="text-foreground-muted/50 ml-1">(coming soon)</span>
            </span>
            <span className="cursor-default">
              Terms of Service <span className="text-foreground-muted/50 ml-1">(coming soon)</span>
            </span>
            <span className="cursor-default">
              Contact <span className="text-foreground-muted/50 ml-1">(coming soon)</span>
            </span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
