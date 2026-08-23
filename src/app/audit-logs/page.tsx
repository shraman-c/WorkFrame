"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";

interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetEntity: string;
  targetId: string;
  timestamp: string;
  user: {
    id: string;
    employeeId: string;
    email: string;
    profile: {
      fullName: string;
    } | null;
  };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function AuditLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [search, setSearch] = useState("");
  const [targetEntity, setTargetEntity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", "20");
      if (search) params.append("search", search);
      if (targetEntity) params.append("targetEntity", targetEntity);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const data = await apiFetch<{ auditLogs: AuditLog[]; pagination: Pagination }>(
        `/api/audit-logs?${params.toString()}`
      );
      setLogs(data.auditLogs);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, targetEntity, startDate, endDate]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "ADMIN") {
        router.replace("/employees");
      } else {
        fetchLogs();
      }
    }
  }, [user, authLoading, router, fetchLogs]);

  // Reset page when filters change
  const handleFilterChange = () => {
    setPage(1);
  };

  if (authLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  function getActionBadgeColor(action: string) {
    if (action.includes("CREATE") || action.includes("UPLOAD")) return "bg-success/15 text-success border border-success/20";
    if (action.includes("DELETE") || action.includes("REVOKE") || action.includes("REJECTED")) return "bg-danger/15 text-danger border border-danger/20";
    if (action.includes("UPDATE") || action.includes("DECISION") || action.includes("APPROVED")) return "bg-warning/15 text-warning border border-warning/20";
    return "bg-info/15 text-info border border-info/20";
  }

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground-primary">
              Admin Activity Log
            </h1>
            <p className="text-xs text-foreground-muted mt-1">
              Audit trail of all administrative actions and system updates.
            </p>
          </div>
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="self-start sm:self-auto text-xs text-foreground-muted hover:text-foreground-primary border border-surface-border px-3 py-1.5 rounded hover:bg-surface-overlay transition-colors"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Filters Panel */}
        <div className="card mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] text-foreground-muted uppercase tracking-wider block mb-1.5">
              Search Actor
            </label>
            <input
              type="text"
              placeholder="Name, email, or employee ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-foreground-muted uppercase tracking-wider block mb-1.5">
              Target Entity
            </label>
            <select
              value={targetEntity}
              onChange={(e) => { setTargetEntity(e.target.value); handleFilterChange(); }}
              className="input-field text-xs"
            >
              <option value="">All Entities</option>
              <option value="EmployeeProfile">Employee Profile</option>
              <option value="SalaryStructure">Salary Structure / Payslip</option>
              <option value="LeaveRequest">Leave Request</option>
              <option value="Document">Document</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-foreground-muted uppercase tracking-wider block mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); handleFilterChange(); }}
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-foreground-muted uppercase tracking-wider block mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); handleFilterChange(); }}
              className="input-field text-xs"
            />
          </div>
        </div>

        {/* Activity Table */}
        <div className="card overflow-hidden p-0 mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left bg-surface-base border-b border-surface-border">
                  <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Actor</th>
                  <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Target Entity</th>
                  <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Target ID</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12"><LoadingSpinner size="sm" /></td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-foreground-muted">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-surface-border last:border-0 hover:bg-surface-overlay transition-colors bg-surface-raised"
                    >
                      <td className="px-4 py-3 text-foreground-secondary font-mono">
                        {new Date(log.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground-primary">
                          {log.user?.profile?.fullName || "System Admin"}
                        </div>
                        <div className="text-[10px] text-foreground-muted font-mono">
                          {log.user?.employeeId || log.user?.email || log.actorId}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded uppercase ${getActionBadgeColor(log.action)}`}>
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground-primary font-medium">
                        {log.targetEntity}
                      </td>
                      <td className="px-4 py-3 text-foreground-secondary font-mono max-w-[120px] truncate" title={log.targetId}>
                        {log.targetId}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-surface-border text-xs rounded hover:bg-surface-overlay transition-all font-medium text-foreground-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 border border-surface-border text-xs rounded hover:bg-surface-overlay transition-all font-medium text-foreground-secondary"
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
