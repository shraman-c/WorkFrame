"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  employeeId?: string;
  user?: { employeeId: string; profile: { fullName: string } | null };
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PRESENT: "bg-success",
    ABSENT: "bg-danger",
    LEAVE: "bg-info",
    HALF_DAY: "bg-warning",
  };
  const labels: Record<string, string> = {
    PRESENT: "Present",
    ABSENT: "Absent",
    LEAVE: "On Leave",
    HALF_DAY: "Half Day",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${colors[status] || "bg-surface-overlay"}`} />
      <span className="text-foreground-secondary">{labels[status] || status}</span>
    </div>
  );
}

export default function AttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "date">("day");
  const [searchEmployee, setSearchEmployee] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const selectedDateStr = selectedDate.toISOString().split("T")[0];

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("pageSize", "20");
        if (searchEmployee) params.append("search", searchEmployee);
        if (department) params.append("department", department);
        
        if (viewMode === "day") {
          params.append("startDate", selectedDateStr);
          params.append("endDate", selectedDateStr);
        } else {
          const start = new Date(selectedDate);
          start.setDate(start.getDate() - 6);
          params.append("startDate", start.toISOString().split("T")[0]);
          params.append("endDate", selectedDateStr);
        }

        const data = await apiFetch<{ records: AttendanceRecord[]; pagination: { total: number; totalPages: number } }>(
          `/api/attendance?${params.toString()}`
        );
        setRecords(data.records);
        setPagination({ total: data.pagination.total, totalPages: data.pagination.totalPages });
      } else {
        const data = await apiFetch<{ records: AttendanceRecord[] }>("/api/attendance/me?range=weekly");
        setRecords(data.records);
        const today = new Date().toISOString().split("T")[0];
        const todayRec = data.records.find((r) => r.date.startsWith(today));
        setTodayRecord(todayRec || null);
      }
    } catch { /* handle silently */ } finally { setLoading(false); }
  }, [isAdmin, page, searchEmployee, department, viewMode, selectedDateStr, selectedDate]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Reset page when date or mode changes
  useEffect(() => {
    setPage(1);
  }, [selectedDateStr, viewMode]);

  async function handleCheckIn() {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch<{ message: string; record: AttendanceRecord }>("/api/attendance/check-in", { method: "POST" });
      setTodayRecord(res.record);
      setMessage({ type: "success", text: res.message });
      fetchRecords();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Check-in failed" });
    } finally { setActionLoading(false); }
  }

  async function handleCheckOut() {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch<{ message: string; record: AttendanceRecord }>("/api/attendance/check-out", { method: "POST" });
      setTodayRecord(res.record);
      setMessage({ type: "success", text: res.message });
      fetchRecords();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Check-out failed" });
    } finally { setActionLoading(false); }
  }

  const hasCheckedIn = !!todayRecord?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOut;

  function navigateDate(direction: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + direction);
    setSelectedDate(d);
  }

  const filteredDayRecords = records;

  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const leaveCount = records.filter((r) => r.status === "LEAVE").length;
  const totalWorking = records.length;

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date navigation + view toggle */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => navigateDate(-1)} className="w-8 h-8 flex items-center justify-center text-foreground-muted hover:text-foreground-primary hover:bg-surface-overlay transition-colors rounded">&lsaquo;</button>
            <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1.5 text-sm font-medium text-foreground-primary hover:bg-surface-overlay transition-colors rounded">
              {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </button>
            <button onClick={() => navigateDate(1)} className="w-8 h-8 flex items-center justify-center text-foreground-muted hover:text-foreground-primary hover:bg-surface-overlay transition-colors rounded">&rsaquo;</button>
          </div>
          <div className="flex border border-surface-border rounded overflow-hidden">
            <button onClick={() => setViewMode("day")} className={`px-3 py-1 text-xs font-medium transition-colors ${viewMode === "day" ? "bg-accent text-white" : "text-foreground-muted hover:text-foreground-primary"}`}>Day</button>
            <button onClick={() => setViewMode("date")} className={`px-3 py-1 text-xs font-medium transition-colors ${viewMode === "date" ? "bg-accent text-white" : "text-foreground-muted hover:text-foreground-primary"}`}>Date</button>
          </div>
        </div>

        {/* Summary chips (employee) */}
        {!isAdmin && (
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1.5 text-xs font-medium bg-success/10 text-success border border-success/20 rounded">Present: {presentCount}</span>
            <span className="px-3 py-1.5 text-xs font-medium bg-warning/10 text-warning border border-warning/20 rounded">Leaves: {leaveCount}</span>
            <span className="px-3 py-1.5 text-xs font-medium bg-surface-overlay text-foreground-secondary border border-surface-border rounded">Total Working: {totalWorking}</span>
          </div>
        )}

        {/* Admin: search & department filter */}
        {isAdmin && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
            <div className="flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Search employee by name/ID..."
                value={searchEmployee}
                onChange={(e) => { setSearchEmployee(e.target.value); setPage(1); }}
                className="input-field text-sm"
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={department}
                onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
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
        )}

        {message && (
          <div className={`mb-4 p-3 text-xs ${message.type === "success" ? "bg-success/10 border border-success/20 text-success" : "bg-danger/10 border border-danger/20 text-danger"}`}>{message.text}</div>
        )}

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left bg-surface-base border-b border-surface-border">
                  <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Date</th>
                  {isAdmin && <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Employee</th>}
                  <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Check In</th>
                  <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Check Out</th>
                  <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Work Hours</th>
                  <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Extra Hours</th>
                  <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isAdmin ? 7 : 6} className="px-4 py-8"><LoadingSpinner size="sm" /></td></tr>
                ) : filteredDayRecords.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 7 : 6} className="px-4 py-6 text-center text-foreground-muted">No records for this day.</td></tr>
                ) : (
                  filteredDayRecords.map((rec) => {
                    const checkInTime = rec.checkIn ? new Date(rec.checkIn) : null;
                    const checkOutTime = rec.checkOut ? new Date(rec.checkOut) : null;
                    let workHours = "---";
                    let extraHours = "---";
                    if (checkInTime && checkOutTime) {
                      const hours = (checkOutTime.getTime() - checkInTime.getTime()) / 3600000;
                      workHours = hours.toFixed(1) + "h";
                      extraHours = hours > 8 ? "+" + (hours - 8).toFixed(1) + "h" : "---";
                    }
                    return (
                      <tr key={rec.id} className="border-b border-surface-border last:border-0 hover:bg-surface-overlay/50">
                        <td className="px-4 py-3 text-foreground-secondary font-mono">
                          {new Date(rec.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-foreground-primary font-medium">{rec.user?.profile?.fullName || rec.user?.employeeId || "---"}</td>
                        )}
                        <td className="px-4 py-3 text-foreground-secondary font-mono">{checkInTime ? checkInTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "---"}</td>
                        <td className="px-4 py-3 text-foreground-secondary font-mono">{checkOutTime ? checkOutTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "---"}</td>
                        <td className="px-4 py-3 text-foreground-secondary font-mono">{workHours}</td>
                        <td className="px-4 py-3 font-mono">
                          {extraHours !== "---" ? <span className="text-accent">{extraHours}</span> : <span className="text-foreground-muted">---</span>}
                        </td>
                        <td className="px-4 py-3"><StatusDot status={rec.status} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {isAdmin && !loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-foreground-muted">
              Showing page {page} of {pagination.totalPages} ({pagination.total} records)
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

      {/* Floating Check In/Out pill */}
      {!isAdmin && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          {!hasCheckedIn ? (
            <button onClick={handleCheckIn} disabled={actionLoading} className="px-6 py-3 bg-accent text-white font-semibold text-sm rounded-full shadow-lg hover:bg-accent-hover transition-all disabled:opacity-50">
              {actionLoading ? "..." : "Check In"}
            </button>
          ) : !hasCheckedOut ? (
            <div className="flex items-center gap-3 bg-surface-raised border border-surface-border rounded-full shadow-lg px-4 py-2">
              <span className="text-xs text-foreground-muted font-mono">Since {new Date(todayRecord!.checkIn!).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
              <button onClick={handleCheckOut} disabled={actionLoading} className="px-5 py-2 bg-danger text-white font-semibold text-xs rounded-full hover:bg-red-600 transition-all disabled:opacity-50">
                {actionLoading ? "..." : "Check Out"}
              </button>
            </div>
          ) : (
            <div className="px-5 py-3 bg-success/10 border border-success/20 text-success text-sm font-medium rounded-full shadow-lg">Checked Out</div>
          )}
        </div>
      )}
    </div>
  );
}
