"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  remarks: string | null;
  status: string;
  reviewerComment: string | null;
  createdAt: string;
  user?: { employeeId: string; profile: { fullName: string } | null };
}

function EmployeeTimeOff() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [leaveType, setLeaveType] = useState<"PAID" | "SICK" | "UNPAID">("PAID");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const fetchRequests = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<{ requests: LeaveRequest[] }>("/api/leave-requests/me");
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load time off requests.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await apiFetch("/api/leave-requests", { method: "POST", body: { leaveType, startDate, endDate, remarks: remarks || undefined } });
      setMessage({ type: "success", text: "Request submitted." });
      setShowModal(false); setStartDate(""); setEndDate(""); setRemarks(""); setLeaveType("PAID");
      fetchRequests();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally { setSubmitting(false); }
  }

  const approvedCount = requests.filter((r) => r.status === "APPROVED" && r.leaveType === "PAID").length;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
  function getStartDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }
  function isLeaveDay(ds: string) {
    for (const r of requests) {
      if (ds >= r.startDate.split("T")[0] && ds <= r.endDate.split("T")[0]) return r.status;
    }
    return null;
  }
  function leaveColor(s: string) {
    if (s === "APPROVED") return "bg-success text-white";
    if (s === "PENDING") return "bg-warning text-white";
    if (s === "REJECTED") return "bg-danger text-white";
    return "";
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-xs bg-danger/10 border border-danger/20 text-danger flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchRequests()} className="text-[10px] font-semibold underline hover:no-underline">Retry</button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Paid Time Off</p>
          <p className="font-heading text-2xl font-bold text-foreground-primary">{Math.max(0, 12 - approvedCount)} <span className="text-sm font-normal text-foreground-muted">Days Available</span></p>
        </div>
        <div className="card">
          <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Sick Time Off</p>
          <p className="font-heading text-2xl font-bold text-foreground-primary">5 <span className="text-sm font-normal text-foreground-muted">Days Available</span></p>
        </div>
      </div>
      <button onClick={() => setShowModal(true)} className="btn-primary text-sm px-5 py-2">NEW</button>
      {message && <div className={`p-3 text-xs ${message.type === "success" ? "bg-success/10 border border-success/20 text-success" : "bg-danger/10 border border-danger/20 text-danger"}`}>{message.text}</div>}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setCalYear(calYear - 1)} className="text-foreground-muted hover:text-foreground-primary">&lsaquo;</button>
            <span className="font-heading text-lg font-semibold text-foreground-primary">{calYear}</span>
            <button onClick={() => setCalYear(calYear + 1)} className="text-foreground-muted hover:text-foreground-primary">&rsaquo;</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {months.map((month, mIdx) => (
              <div key={mIdx} className="card p-3">
                <p className="text-xs font-semibold text-foreground-primary mb-2">{month}</p>
                <div className="grid grid-cols-7 gap-0.5">
                  {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="text-[8px] text-foreground-muted text-center">{d}</div>)}
                  {Array.from({ length: getStartDay(calYear, mIdx) }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: getDaysInMonth(calYear, mIdx) }).map((_, d) => {
                    const day = d + 1;
                    const ds = `${calYear}-${String(mIdx+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                    const ls = isLeaveDay(ds);
                    return <div key={day} className={`text-center text-[10px] py-0.5 rounded ${ls ? leaveColor(ls) : "text-foreground-secondary"}`}>{day}</div>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:w-48 space-y-4 shrink-0">
          <div className="card p-3">
            <p className="text-xs font-semibold text-foreground-primary mb-3">Legend</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-success" /><span className="text-xs text-foreground-secondary">Validated</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-warning" /><span className="text-xs text-foreground-secondary">To Approve</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-danger" /><span className="text-xs text-foreground-secondary">Refused</span></div>
            </div>
          </div>
          <div className="card p-3">
            <p className="text-xs font-semibold text-foreground-primary mb-3">Public Holidays</p>
            <div className="space-y-2">
              <div><p className="text-xs text-foreground-secondary">Jan 1</p><p className="text-[10px] text-foreground-muted">New Year</p></div>
              <div><p className="text-xs text-foreground-secondary">Jul 4</p><p className="text-[10px] text-foreground-muted">Independence Day</p></div>
              <div><p className="text-xs text-foreground-secondary">Dec 25</p><p className="text-[10px] text-foreground-muted">Christmas</p></div>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-raised border border-surface-border w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-surface-border">
              <h2 className="font-heading text-lg font-semibold text-foreground-primary">Time Off Type Request</h2>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="text-xs text-foreground-muted block mb-1.5">Employee</label>
                <input type="text" readOnly value={user?.email || ""} className="input-field text-sm opacity-60 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs text-foreground-muted block mb-1.5">Time Off Type</label>
                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as "PAID" | "SICK" | "UNPAID")} className="input-field text-sm">
                  <option value="PAID">Paid Time Off</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="UNPAID">Unpaid Leaves</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-foreground-muted block mb-1.5">From</label><input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field text-sm" /></div>
                <div><label className="text-xs text-foreground-muted block mb-1.5">To</label><input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field text-sm" /></div>
              </div>
              <div>
                <label className="text-xs text-foreground-muted block mb-1.5">Remarks</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className="input-field text-sm" placeholder="Reason for leave..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-foreground-secondary border border-surface-border hover:bg-surface-overlay rounded">Discard</button>
                <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">{submitting ? "Submitting..." : "Submit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminTimeOff() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({ ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Decision modal state
  const [decisionTarget, setDecisionTarget] = useState<LeaveRequest | null>(null);
  const [decisionAction, setDecisionAction] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [decisionComment, setDecisionComment] = useState("");
  const [deciding, setDeciding] = useState(false);

  const fetchRequests = useCallback(async (initial = false) => {
    setError(null);
    if (initial) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", "10");
      if (filter !== "ALL") params.append("status", filter);
      if (search) params.append("search", search);
      if (department) params.append("department", department);

      const data = await apiFetch<{
        requests: LeaveRequest[];
        counts: Record<string, number>;
        pagination: { total: number; totalPages: number };
      }>(`/api/leave-requests?${params.toString()}`);

      setRequests(data.requests);
      setCounts(data.counts);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  }, [page, filter, search, department]);

  useEffect(() => {
    fetchRequests(true);
  }, [fetchRequests]);

  const handleFilterChange = () => {
    setPage(1);
  };

  function openDecision(lr: LeaveRequest, action: "APPROVED" | "REJECTED") {
    setDecisionTarget(lr);
    setDecisionAction(action);
    setDecisionComment("");
  }

  async function handleDecision() {
    if (!decisionTarget || !decisionAction) return;
    setDeciding(true); setMessage(null);
    try {
      await apiFetch(`/api/leave-requests/${decisionTarget.id}/decision`, {
        method: "PATCH",
        body: { status: decisionAction, reviewerComment: decisionComment || undefined },
      });
      setMessage({ type: "success", text: `Request ${decisionAction === "APPROVED" ? "approved" : "rejected"} successfully.` });
      setDecisionTarget(null); setDecisionAction(null); setDecisionComment("");
      fetchRequests();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to process decision." });
    } finally { setDeciding(false); }
  }

  const tabs = [
    { key: "ALL" as const, label: "All", count: counts.ALL },
    { key: "PENDING" as const, label: "Pending", count: counts.PENDING },
    { key: "APPROVED" as const, label: "Approved", count: counts.APPROVED },
    { key: "REJECTED" as const, label: "Rejected", count: counts.REJECTED },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground-primary">Leave Requests</h1>
          {counts.PENDING > 0 && (
            <span className="inline-flex items-center mt-1 px-2 py-0.5 text-[10px] font-semibold bg-warning/15 text-warning border border-warning/20 rounded">
              {counts.PENDING} pending decision{counts.PENDING !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button onClick={() => fetchRequests(false)} disabled={loading} className="text-xs text-foreground-muted hover:text-foreground-primary border border-surface-border px-3 py-1.5 rounded hover:bg-surface-overlay disabled:opacity-50">
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {message && (
        <div className={`p-3 text-xs ${message.type === "success" ? "bg-success/10 border border-success/20 text-success" : "bg-danger/10 border border-danger/20 text-danger"}`}>{message.text}</div>
      )}

      {error && (
        <div className="p-3 text-xs bg-danger/10 border border-danger/20 text-danger flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchRequests()} className="text-[10px] font-semibold underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-surface-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setFilter(t.key); handleFilterChange(); }}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              filter === t.key
                ? "border-accent text-accent"
                : "border-transparent text-foreground-muted hover:text-foreground-secondary"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${
                t.key === "PENDING" ? "bg-warning/15 text-warning" : "bg-surface-overlay text-foreground-muted"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Department Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
            className="input-field text-xs pl-8"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-muted text-xs">&#128269;</span>
        </div>
        <div className="w-full sm:w-48">
          <select
            value={department}
            onChange={(e) => { setDepartment(e.target.value); handleFilterChange(); }}
            className="input-field text-xs"
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

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left bg-surface-base border-b border-surface-border">
                <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Start Date</th>
                <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">End Date</th>
                <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Remarks</th>
                <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 font-medium text-foreground-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12"><LoadingSpinner size="sm" /></td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <p className="text-foreground-muted text-sm">{filter === "ALL" && !search ? "No leave requests found." : `No ${filter.toLowerCase()} requests${search ? " matching \"" + search + "\"" : ""}.`}</p>
                  <button onClick={() => { setFilter("ALL"); setSearch(""); setDepartment(""); setPage(1); }} className="mt-2 text-[10px] text-accent hover:text-accent-hover font-medium">Clear filters</button>
                </td></tr>
              ) : (
                requests.map((lr) => (
                  <tr key={lr.id} className="border-b border-surface-border last:border-0 hover:bg-surface-overlay/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground-primary">{lr.user?.profile?.fullName || "---"}</div>
                      <div className="text-[10px] text-foreground-muted font-mono">{lr.user?.employeeId || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary font-mono">{new Date(lr.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-foreground-secondary font-mono">{new Date(lr.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded ${
                        lr.leaveType === "PAID" ? "bg-info/15 text-info border border-info/20" :
                        lr.leaveType === "SICK" ? "bg-warning/15 text-warning border border-warning/20" :
                        "bg-surface-overlay text-foreground-muted border border-surface-border"
                      }`}>{lr.leaveType}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary max-w-[180px] truncate" title={lr.remarks || ""}> {lr.remarks || <span className="text-foreground-muted italic">No remarks</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        lr.status === "APPROVED" ? "bg-success/15 text-success border border-success/20" :
                        lr.status === "REJECTED" ? "bg-danger/15 text-danger border border-danger/20" :
                        "bg-warning/15 text-warning border border-warning/20"
                      }`}>{lr.status}</span>
                      {lr.reviewerComment && (
                        <p className="text-[10px] text-foreground-muted mt-1 max-w-[180px] truncate" title={lr.reviewerComment}>Comment: {lr.reviewerComment}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {lr.status === "PENDING" ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openDecision(lr, "APPROVED")} className="px-3 py-1 text-[10px] font-semibold bg-success text-white rounded hover:bg-green-600 transition-colors">
                            Approve
                          </button>
                          <button onClick={() => openDecision(lr, "REJECTED")} className="px-3 py-1 text-[10px] font-semibold bg-danger text-white rounded hover:bg-red-600 transition-colors">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-foreground-muted">{lr.reviewerComment ? "Decided" : "---"}</span>
                      )}
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
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-foreground-muted">
            Showing page {page} of {pagination.totalPages} ({pagination.total} requests)
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

      {/* Decision confirmation modal */}
      {decisionTarget && decisionAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setDecisionTarget(null); setDecisionAction(null); }}>
          <div className="bg-surface-raised border border-surface-border w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-surface-border">
              <h2 className={`font-heading text-lg font-semibold ${decisionAction === "APPROVED" ? "text-success" : "text-danger"}`}>
                {decisionAction === "APPROVED" ? "Approve" : "Reject"} Leave Request
              </h2>
              <p className="text-xs text-foreground-muted mt-1">
                {decisionTarget.user?.profile?.fullName || decisionTarget.user?.employeeId || "Employee"}
                {' '}&mdash;{' '}
                {new Date(decisionTarget.startDate).toLocaleDateString()} to {new Date(decisionTarget.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase tracking-wider block mb-1">Type</label>
                  <span className="text-xs text-foreground-secondary font-medium">{decisionTarget.leaveType}</span>
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase tracking-wider block mb-1">Employee Remarks</label>
                  <p className="text-xs text-foreground-secondary">{decisionTarget.remarks || <span className="italic text-foreground-muted">None</span>}</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-foreground-muted block mb-1.5">Comment (optional)</label>
                <textarea
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  rows={3}
                  className="input-field text-xs"
                  placeholder={decisionAction === "APPROVED" ? "Any notes for the employee..." : "Reason for rejection..."}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-surface-border flex justify-end gap-3">
              <button onClick={() => { setDecisionTarget(null); setDecisionAction(null); }} className="px-4 py-2 text-xs font-medium text-foreground-secondary border border-surface-border hover:bg-surface-overlay rounded">
                Cancel
              </button>
              <button
                onClick={handleDecision}
                disabled={deciding}
                className={`px-5 py-2 text-xs font-semibold text-white rounded disabled:opacity-50 transition-colors ${
                  decisionAction === "APPROVED" ? "bg-success hover:bg-green-600" : "bg-danger hover:bg-red-600"
                }`}
              >
                {deciding ? "Processing..." : decisionAction === "APPROVED" ? "Confirm Approval" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimeOffPage() {
  const { user, loading: authLoading } = useAuth();
  if (authLoading) return <div className="min-h-screen bg-surface-base"><Navbar /><LoadingSpinner /></div>;
  if (!user) return null;
  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === "ADMIN" ? <AdminTimeOff /> : <EmployeeTimeOff />}
      </main>
    </div>
  );
}
