"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ProfileData {
  employeeId: string;
  profile: {
    fullName: string;
    jobTitle: string | null;
    department: string | null;
  } | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/* ── Consistent SVG icons (line-style, 20×20, stroke-based) ──────────── */

function IconClock() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function IconCurrency() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

/* ── Action Card ────────────────────────────────────────────────────── */

function ActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block p-6 border border-surface-border bg-surface-raised hover:border-foreground-muted hover:bg-surface-overlay transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      aria-label={`Go to ${title}`}
    >
      {/* Icon chip — accent glyph on neutral dark chip */}
      <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center mb-4 text-accent transition-colors duration-200 group-hover:bg-surface-border">
        {icon}
      </div>
      <h3 className="text-sm font-semibold tracking-tight text-foreground-primary mb-1 transition-colors duration-200 group-hover:text-foreground-primary">
        {title}
      </h3>
      <p className="text-xs text-foreground-muted leading-relaxed">{description}</p>
      {/* Hover underline */}
      <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-foreground-muted group-hover:w-full transition-all duration-300" />
    </Link>
  );
}

/* ── Dashboard ──────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch<ProfileData>("/api/me/profile")
      .then(setProfile)
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [user]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) return null;

  const firstName = profile?.profile?.fullName?.split(" ")[0] || user.email.split("@")[0];
  const department = profile?.profile?.department || "";
  const jobTitle = profile?.profile?.jobTitle || "";

  const initials = (profile?.profile?.fullName || user.email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  /* Subtitle: "Job Title, Department" — only the facts that exist */
  const subtitle = [jobTitle, department].filter(Boolean).join(", ");

  const actions = [
    {
      href: "/attendance",
      icon: <IconClock />,
      title: "Attendance",
      description: "Check in, track hours, and view your attendance history.",
    },
    {
      href: "/time-off",
      icon: <IconCalendar />,
      title: "Time Off",
      description: "Request leave and check the status of your applications.",
    },
    {
      href: "/payroll",
      icon: <IconCurrency />,
      title: "My Payroll",
      description: "View salary details and download your payslips.",
    },
    {
      href: "/profile",
      icon: <IconUser />,
      title: "My Profile",
      description: "Manage your personal information and preferences.",
    },
  ];

  return (
    <div className="min-h-screen relative z-10">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* ── Greeting Section ── */}
        <div className="mb-12">
          <div className="flex items-start gap-5">
            {/* Initials avatar with presence dot */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center">
                <span className="font-heading text-lg font-bold text-accent tracking-tight">
                  {initials}
                </span>
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-success border-2 border-surface-base" />
            </div>

            <div className="min-w-0">
              <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground-primary">
                {getGreeting()}, {firstName}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm text-foreground-muted">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Action Cards — 2×2 grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map((action) => (
            <ActionCard key={action.href} {...action} />
          ))}
        </div>
      </main>
    </div>
  );
}
