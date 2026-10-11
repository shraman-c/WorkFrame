"use client";

import { useEffect, useState, useCallback } from "react";
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

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  leaveToday: number;
  pendingLeaves: number;
}

export default function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", "12");
      if (search) params.append("search", search);
      if (department) params.append("department", department);

      const data = await apiFetch<{ users: Employee[]; pagination: { total: number; totalPages: number } }>(
        `/api/employees?${params.toString()}`
      );
      setEmployees(data.users);
      setPagination(data.pagination);
    } catch {
      /* handle silently */
    } finally {
      setLoading(false);
    }
  }, [page, search, department]);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await apiFetch<DashboardStats>("/api/dashboard/stats");
      setStats(data);
    } catch {
      /* handle silently */
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterChange = () => {
    setPage(1);
  };

  function getStatusDot(emp: Employee) {
    if (emp.onLeave) return "bg-info"; // airplane icon placeholder — blue dot
    if (emp.attendanceToday?.status === "PRESENT") return "bg-success";
    return "bg-warning"; // absent
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Dashboard Stats Row */}
        {isAdmin && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Total Employees</p>
              <p className="font-heading text-2xl font-bold text-foreground-primary">{stats.totalEmployees}</p>
            </div>
            <div className="card">
              <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Present Today</p>
              <p className="font-heading text-2xl font-bold text-foreground-primary">{stats.presentToday}</p>
            </div>
            <div className="card">
              <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">On Leave Today</p>
              <p className="font-heading text-2xl font-bold text-foreground-primary">{stats.leaveToday}</p>
            </div>
            <div className="card">
              <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Pending Leave Requests</p>
              <p className="font-heading text-2xl font-bold text-foreground-primary">{stats.pendingLeaves}</p>
            </div>
          </div>
        )}

        {/* Header row: NEW button + search + department */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
          {isAdmin && (
            <Link
              href="/employees/new"
              className="btn-primary text-sm px-5 py-2 shrink-0 text-center"
            >
              NEW
            </Link>
          )}
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Search employees by name/ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
              className="input-field text-sm"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); handleFilterChange(); }}
              className="input-field text-sm"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : employees.length === 0 ? (
          <p className="text-sm text-foreground-muted">No employees found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => (
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

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 border-t border-surface-border pt-6">
            <span className="text-xs text-foreground-muted">
              Showing page {page} of {pagination.totalPages} ({pagination.total} employees)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-surface-border text-xs rounded hover:bg-surface-overlay disabled:opacity-40 transition-all font-medium text-foreground-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 border border-surface-border text-xs rounded hover:bg-surface-overlay disabled:opacity-40 transition-all font-medium text-foreground-secondary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
