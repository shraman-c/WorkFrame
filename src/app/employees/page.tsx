"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Employee {
  id: string;
  employeeId: string;
  email: string;
  emailVerified: boolean;
  profile: { fullName: string; department: string | null; jobTitle: string | null; profilePictureUrl: string | null } | null;
  attendanceToday?: { status: string } | null;
  onLeave?: boolean;
}

export default function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const data = await apiFetch<{ users: Employee[] }>("/api/employees");
        setEmployees(data.users);
      } catch { /* handle silently */ } finally { setLoading(false); }
    }
    fetchEmployees();
  }, []);

  const filtered = employees.filter((emp) => {
    const q = search.toLowerCase();
    return (
      !q ||
      emp.profile?.fullName?.toLowerCase().includes(q) ||
      emp.employeeId.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.profile?.department?.toLowerCase().includes(q)
    );
  });

  function getStatusDot(emp: Employee) {
    if (emp.onLeave) return "bg-info"; // airplane icon placeholder — blue dot
    if (emp.attendanceToday?.status === "PRESENT") return "bg-success";
    return "bg-warning"; // absent
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header row: NEW button + search */}
        <div className="flex items-center gap-4 mb-8">
          {isAdmin && (
            <Link
              href="/employees/new"
              className="btn-primary text-sm px-5 py-2 shrink-0"
            >
              NEW
            </Link>
          )}
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field text-sm"
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-foreground-muted">No employees found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((emp) => (
              <Link
                key={emp.id}
                href={`/employees/${emp.id}`}
                className="card relative group hover:border-accent/40 transition-all cursor-pointer"
              >
                {/* Status indicator — top right */}
                <span
                  className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${getStatusDot(emp)}`}
                  title={
                    emp.onLeave
                      ? "On Leave"
                      : emp.attendanceToday?.status === "PRESENT"
                      ? "Present"
                      : "Absent"
                  }
                />

                <div className="flex items-center gap-4">
                  {/* Avatar placeholder */}
                  <div className="w-12 h-12 rounded bg-surface-overlay flex items-center justify-center font-heading text-lg font-bold text-accent shrink-0 overflow-hidden">
                    {emp.profile?.profilePictureUrl ? (
                      <img
                        src={emp.profile.profilePictureUrl}
                        alt={emp.profile?.fullName || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (emp.profile?.fullName || emp.email)[0]?.toUpperCase() || "?"
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground-primary truncate">
                      {emp.profile?.fullName || "No Name"}
                    </p>
                    <p className="text-xs text-foreground-muted truncate">
                      {emp.profile?.jobTitle || emp.profile?.department || emp.employeeId}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
