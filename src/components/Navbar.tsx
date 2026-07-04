"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import NotificationBell from "@/components/NotificationBell";

const tabs = [
  { href: "/employees", label: "Employees" },
  { href: "/attendance", label: "Attendance" },
  { href: "/time-off", label: "Time Off" },
];

export default function Navbar() {
  const { user, signout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const allowedTabs = [
    { href: "/employees", label: "Employees" },
    { href: "/attendance", label: "Attendance" },
    { href: "/time-off", label: "Time Off" },
    ...(user.role === "ADMIN" ? [{ href: "/audit-logs", label: "Activity Log" }] : []),
  ];

  // Determine active tab based on pathname
  const activeTab = allowedTabs.find((t) => pathname.startsWith(t.href))?.href || "";

  // User initials for avatar
  const initials = (user.email || "U")[0].toUpperCase();

  async function handleSignOut() {
    setDropdownOpen(false);
    await signout();
    router.push("/");
  }

  return (
    <nav className="bg-surface-raised border-b border-surface-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo — far left */}
          <Link href="/employees" className="flex items-center gap-2 shrink-0">
            <span className="font-heading text-lg font-bold tracking-tight text-foreground-primary uppercase">
              WorkFrame
            </span>
          </Link>

          {/* Horizontal tabs — center */}
          <div className="hidden md:flex items-center gap-1">
            {allowedTabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-accent border-b-2 border-accent"
                      : "text-foreground-secondary hover:text-foreground-primary"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Right side: Notification bell + Avatar with dropdown */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            {/* Avatar with dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 group"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                {/* Status dot */}
                <span className="w-2 h-2 rounded-full bg-success" />
                {/* Avatar circle */}
                <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xs font-bold text-accent group-hover:bg-accent/30 transition-colors">
                  {initials}
                </div>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-surface-raised border border-surface-border shadow-xl z-50">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-foreground-secondary hover:text-foreground-primary hover:bg-surface-overlay transition-colors"
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-foreground-secondary hover:text-danger hover:bg-surface-overlay transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-1 pb-2 overflow-x-auto">
          {allowedTabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "text-accent border-b-2 border-accent"
                    : "text-foreground-muted hover:text-foreground-secondary"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
