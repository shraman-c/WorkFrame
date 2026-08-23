"use client";

import { useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import LoadingSpinner from "@/components/LoadingSpinner";
import LandingNav from "@/components/LandingNav";
import CrowdCanvas from "@/components/effects/CrowdCanvas";

const useBrowserEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* ──────────────────────────────────────────────────────────────────────────
 * Hero Section
 *
 * Headline + subheadline + CTAs with CrowdCanvas strip below.
 * ────────────────────────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <main className="relative z-20 flex flex-col items-center text-center px-6 pt-20 sm:pt-32 pb-16">
      {/* Badge */}
      <div className="relative z-20 rounded-md px-4 py-1.5 mb-8 border border-surface-border bg-surface-raised animate-fade-rise">
        <span className="text-xs font-medium tracking-wide text-foreground-secondary uppercase">
          Human Resource Management
        </span>
      </div>

      {/* Headline */}
      <h1 className="relative z-20 text-5xl sm:text-7xl md:text-[5.5rem] leading-[0.92] tracking-[-2.5px] max-w-6xl font-normal text-foreground-primary animate-fade-rise font-heading">
        HR that stays out of your way
      </h1>

      {/* Subheadline */}
      <p className="relative z-20 text-foreground-secondary text-base sm:text-lg max-w-xl mt-8 leading-relaxed animate-fade-rise-delay">
        Attendance, leave, payroll, and approvals — managed in one place,
        built for focus.
      </p>

      {/* CTA row */}
      <div className="relative z-20 flex flex-col sm:flex-row items-center gap-4 mt-12 animate-fade-rise-delay-2">
        <Link
          href="/signup"
          className="px-10 py-3.5 text-sm font-semibold bg-accent text-surface-base rounded-md hover:bg-accent-hover hover:scale-[1.03] transition-all duration-200 cursor-pointer"
        >
          Get Started Free
        </Link>
        <Link
          href="#how-it-works"
          className="px-8 py-3.5 text-sm font-medium text-foreground-secondary border border-surface-border rounded-md hover:text-foreground-primary hover:border-foreground-muted transition-all duration-200 cursor-pointer"
        >
          See how it works
        </Link>
      </div>

      {/* CrowdCanvas strip — walking figures below CTAs */}
      <div className="relative w-full h-48 md:h-64 mt-6 overflow-hidden">
        <CrowdCanvas />
      </div>
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Benefits Section — 5 benefit cards matching dashboard ActionCard style
 *
 * Uses the exact same card + icon-chip styling as the dashboard's action
 * cards: solid bg-surface-raised, accent icon chip, sharp corners.
 * ────────────────────────────────────────────────────────────────────────── */

/* SVG icons — same line-style, 20x20, stroke-based as the dashboard */
function IconStack() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function IconUserCheck() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25 4.5-4.5" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function IconClipboardDocumentList() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

const BENEFITS = [
  {
    icon: <IconStack />,
    title: "One platform, all of HR",
    description:
      "Attendance, leave, payroll, and approvals in a single tool — no more spreadsheets or scattered apps.",
  },
  {
    icon: <IconUserCheck />,
    title: "Self-service for your team",
    description:
      "Employees check in, request leave, and download payslips on their own — no emailing HR.",
  },
  {
    icon: <IconShield />,
    title: "Role-based access built in",
    description:
      "Sensitive salary and document data is only visible to the people who need it.",
  },
  {
    icon: <IconBolt />,
    title: "Fast leave approvals",
    description:
      "A single queue for admins, real-time status for employees — approvals take seconds, not days.",
  },
  {
    icon: <IconClipboardDocumentList />,
    title: "Audit trail on every action",
    description:
      "Every admin action is logged for accountability and compliance — full visibility, zero effort.",
  },
];

function BenefitsSection() {
  return (
    <section className="relative z-20 max-w-6xl mx-auto px-6 py-24">
      <div className="mb-12">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground-primary">
          Built for the work, not the paperwork
        </h2>
        <p className="mt-4 text-sm text-foreground-muted max-w-lg">
          Everything your team needs to manage people — nothing they don&apos;t.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BENEFITS.map((benefit) => (
          <div
            key={benefit.title}
            className="group relative block p-6 border border-surface-border bg-surface-raised hover:border-foreground-muted hover:bg-surface-overlay transition-all duration-200"
          >
            {/* Icon chip — same size + style as dashboard ActionCard */}
            <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center mb-4 text-accent transition-colors duration-200 group-hover:bg-surface-border">
              {benefit.icon}
            </div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground-primary mb-1">
              {benefit.title}
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              {benefit.description}
            </p>
            {/* Hover underline — same as dashboard ActionCard */}
            <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-foreground-muted group-hover:w-full transition-all duration-300" />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * How It Works — 3 concrete steps
 * ────────────────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    number: "01",
    title: "Sign Up",
    description:
      "Create your company account in minutes — just a name, email, and password.",
  },
  {
    number: "02",
    title: "Add Your Team",
    description:
      "Invite employees and assign roles. Admin or employee — access is scoped automatically.",
  },
  {
    number: "03",
    title: "Run HR Day-to-Day",
    description:
      "Track attendance, approve leave, manage payroll — all from one dashboard.",
  },
];

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative z-20 max-w-6xl mx-auto px-6 py-24"
    >
      <div className="mb-12">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground-primary">
          Up and running in three steps
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className="p-6 border border-surface-border bg-surface-raised"
          >
            <span className="inline-block text-3xl font-heading font-bold text-accent/30 mb-3">
              {step.number}
            </span>
            <h3 className="text-sm font-semibold tracking-tight text-foreground-primary mb-2">
              {step.title}
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Landing Page
 * ────────────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useBrowserEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      {/* Nav */}
      <LandingNav />

      {/* Hero */}
      <HeroSection />

      {/* Benefits */}
      <BenefitsSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Final CTA */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground-primary mb-4">
          Ready to simplify your HR?
        </h2>
        <p className="text-sm text-foreground-muted mb-8 max-w-md mx-auto">
          Join teams that spend less time on admin and more time on the work
          that matters.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-10 py-3.5 text-sm font-semibold bg-accent text-surface-base rounded-md hover:bg-accent-hover hover:scale-[1.03] transition-all duration-200"
          >
            Get Started Free
          </Link>
          <Link
            href="/signin"
            className="px-8 py-3.5 text-sm font-medium text-foreground-secondary border border-surface-border rounded-md hover:text-foreground-primary hover:border-foreground-muted transition-all duration-200"
          >
            Sign In
          </Link>
        </div>
      </section>
    </div>
  );
}
