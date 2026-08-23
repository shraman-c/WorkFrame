"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, getAccessToken } from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SalaryRecord {
  id: string;
  employeeId: string;
  baseSalary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  netSalary: number;
  effectiveDate: string;
  createdAt: string;
  user?: {
    employeeId: string;
    profile: { fullName: string } | null;
  };
}

interface SalaryResponse {
  current: SalaryRecord | null;
  history: SalaryRecord[];
}

interface AdminSalaryResponse {
  salaries: SalaryRecord[];
}

// ─── Shared Helpers ──────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Shared helper: fetches a PDF blob from the payslip endpoint and triggers a browser download.
 */
async function triggerPayslipDownload(url: string, fallbackFilename: string) {
  const token = getAccessToken();
  if (!token) return;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Failed to download payslip");
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="(.+)"/);
  const filename = match ? match[1] : fallbackFilename;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── Employee Payroll View ───────────────────────────────────────────────────

function EmployeePayroll() {
  const [data, setData] = useState<SalaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    apiFetch<SalaryResponse>("/api/payroll/me")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function downloadPayslip(salaryId?: string) {
    setDownloading(true);
    try {
      const url = salaryId
        ? `/api/payroll/me/payslip?salaryId=${salaryId}`
        : "/api/payroll/me/payslip";
      await triggerPayslipDownload(url, "payslip.pdf");
    } catch {
      /* best-effort */
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  const current = data?.current;
  if (!current) {
    return (
      <div className="card text-center py-12">
        <p className="text-sm text-foreground-muted">No salary record found. Contact your HR admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current salary summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="label-tactical mb-1">Current Salary</p>
            <h2 className="font-heading text-2xl font-bold text-foreground-primary">
              {formatCurrency(current.netSalary)}
            </h2>
            <p className="text-xs text-foreground-muted font-mono mt-1">
              Effective {formatDate(current.effectiveDate)}
            </p>
          </div>
          <button
            onClick={() => downloadPayslip()}
            disabled={downloading}
            className="btn-primary text-xs"
          >
            {downloading ? "Generating..." : "Download Payslip"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Base salary */}
          <div>
            <p className="label-tactical mb-2">Base Salary</p>
            <p className="font-heading text-lg font-semibold text-foreground-primary">
              {formatCurrency(current.baseSalary)}
            </p>
          </div>

          {/* Allowances */}
          <div>
            <p className="label-tactical mb-2">Allowances</p>
            <div className="space-y-1">
              {Object.entries(current.allowances).length === 0 ? (
                <p className="text-xs text-foreground-muted">None</p>
              ) : (
                Object.entries(current.allowances).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-foreground-secondary capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="text-foreground-primary font-mono">{formatCurrency(value)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Deductions */}
          <div>
            <p className="label-tactical mb-2">Deductions</p>
            <div className="space-y-1">
              {Object.entries(current.deductions).length === 0 ? (
                <p className="text-xs text-foreground-muted">None</p>
              ) : (
                Object.entries(current.deductions).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-foreground-secondary capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="text-danger font-mono">-{formatCurrency(value)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Salary history */}
      {data && data.history.length > 1 && (
        <div className="card">
          <h2 className="section-title mb-4">Salary History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-foreground-muted border-b border-surface-border">
                  <th className="pb-2 font-medium label-tactical">Effective Date</th>
                  <th className="pb-2 font-medium label-tactical">Base</th>
                  <th className="pb-2 font-medium label-tactical">Allowances</th>
                  <th className="pb-2 font-medium label-tactical">Deductions</th>
                  <th className="pb-2 font-medium label-tactical">Net</th>
                  <th className="pb-2 font-medium label-tactical"></th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((s) => (
                  <tr key={s.id} className="border-b border-surface-border last:border-0 hover:bg-surface-overlay bg-surface-raised">
                    <td className="py-2.5 font-mono text-foreground-secondary">{formatDate(s.effectiveDate)}</td>
                    <td className="py-2.5 text-foreground-primary">{formatCurrency(s.baseSalary)}</td>
                    <td className="py-2.5 text-success">
                      +{formatCurrency(Object.values(s.allowances).reduce((a, b) => a + b, 0))}
                    </td>
                    <td className="py-2.5 text-danger">
                      -{formatCurrency(Object.values(s.deductions).reduce((a, b) => a + b, 0))}
                    </td>
                    <td className="py-2.5 text-foreground-primary font-medium">{formatCurrency(s.netSalary)}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => downloadPayslip(s.id)}
                        disabled={downloading}
                        className="label-tactical text-accent hover:text-accent-hover"
                      >
                        Payslip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Payroll View ──────────────────────────────────────────────────────

function AdminPayroll() {
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; employeeId: string; profile: { fullName: string } | null }[]>([]);
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formBaseSalary, setFormBaseSalary] = useState("");
  const [formAllowances, setFormAllowances] = useState("");
  const [formDeductions, setFormDeductions] = useState("");
  const [formEffectiveDate, setFormEffectiveDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editBaseSalary, setEditBaseSalary] = useState("");
  const [editAllowances, setEditAllowances] = useState("");
  const [editDeductions, setEditDeductions] = useState("");
  const [editEffectiveDate, setEditEffectiveDate] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchSalaries = useCallback(async () => {
    try {
      const data = await apiFetch<AdminSalaryResponse>("/api/payroll");
      setSalaries(data.salaries);
    } catch {
      /* best-effort */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      let allowances: Record<string, number> = {};
      let deductions: Record<string, number> = {};

      if (formAllowances.trim()) {
        allowances = JSON.parse(formAllowances);
      }
      if (formDeductions.trim()) {
        deductions = JSON.parse(formDeductions);
      }

      await apiFetch("/api/payroll", {
        method: "POST",
        body: {
          employeeId: formEmployeeId,
          baseSalary: parseFloat(formBaseSalary),
          allowances,
          deductions,
          effectiveDate: formEffectiveDate,
        },
      });

      setMessage({ type: "success", text: "Salary structure created." });
      setShowForm(false);
      resetCreateForm();
      fetchSalaries();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSubmitting(false);
    }
  }

  function resetCreateForm() {
    setFormEmployeeId("");
    setFormBaseSalary("");
    setFormAllowances("");
    setFormDeductions("");
    setFormEffectiveDate("");
  }

  async function openCreateForm() {
    setShowForm(true);
    setMessage(null);
    try {
      const data = await apiFetch<{ users: { id: string; employeeId: string; profile: { fullName: string } | null }[] }>("/api/employees");
      setEmployees(data.users);
    } catch {
      /* best-effort */
    }
  }

  function startEdit(salary: SalaryRecord) {
    setEditingId(salary.id);
    setEditEmployeeId(salary.employeeId);
    setEditBaseSalary(salary.baseSalary.toString());
    setEditAllowances(JSON.stringify(salary.allowances));
    setEditDeductions(JSON.stringify(salary.deductions));
    setEditEffectiveDate(new Date().toISOString().split("T")[0]); // today as new effective date
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditEmployeeId("");
    setEditBaseSalary("");
    setEditAllowances("");
    setEditDeductions("");
    setEditEffectiveDate("");
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Confirmation alert before saving
    const confirmed = window.confirm(
      "Are you sure you want to update this salary structure? This will create a new record with the current date as the effective date."
    );
    if (!confirmed) return;

    setEditSubmitting(true);
    setMessage(null);

    try {
      let allowances: Record<string, number> = {};
      let deductions: Record<string, number> = {};

      if (editAllowances.trim()) {
        allowances = JSON.parse(editAllowances);
      }
      if (editDeductions.trim()) {
        deductions = JSON.parse(editDeductions);
      }

      await apiFetch(`/api/payroll/${editingId}`, {
        method: "PATCH",
        body: {
          employeeId: editEmployeeId,
          baseSalary: parseFloat(editBaseSalary),
          allowances,
          deductions,
          effectiveDate: editEffectiveDate,
        },
      });

      setMessage({ type: "success", text: "Salary structure updated." });
      cancelEdit();
      fetchSalaries();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setEditSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 text-xs ${message.type === "success" ? "bg-success/10 border border-success/20 text-success" : "bg-danger/10 border border-danger/20 text-danger"}`}>
          {message.text}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4">
          <h3 className="section-title mb-2">New Salary Structure</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-tactical block mb-1.5">Employee</label>
              <select
                required
                value={formEmployeeId}
                onChange={(e) => setFormEmployeeId(e.target.value)}
                className="input-field"
              >
                <option value="">Select employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.profile?.fullName || emp.employeeId} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-tactical block mb-1.5">Base Salary ($)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formBaseSalary}
                onChange={(e) => setFormBaseSalary(e.target.value)}
                className="input-field"
                placeholder="50000"
              />
            </div>
            <div>
              <label className="label-tactical block mb-1.5">Effective Date</label>
              <input
                type="date"
                required
                value={formEffectiveDate}
                onChange={(e) => setFormEffectiveDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-tactical block mb-1.5">Allowances (JSON)</label>
              <input
                type="text"
                value={formAllowances}
                onChange={(e) => setFormAllowances(e.target.value)}
                className="input-field font-mono text-xs"
                placeholder='{ "hra": 500, "transport": 200, "medical": 100 }'
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-tactical block mb-1.5">Deductions (JSON)</label>
              <input
                type="text"
                value={formDeductions}
                onChange={(e) => setFormDeductions(e.target.value)}
                className="input-field font-mono text-xs"
                placeholder='{ "tax": 800, "pf": 300 }'
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-primary text-xs">
              {submitting ? "Creating..." : "Create Salary Structure"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setMessage(null); }} className="btn-ghost text-xs">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Edit form */}
      {editingId && (
        <form onSubmit={handleEditSubmit} className="card space-y-4 border-accent/30">
          <h3 className="section-title mb-2">Edit Salary Structure</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-tactical block mb-1.5">Base Salary ($)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={editBaseSalary}
                onChange={(e) => setEditBaseSalary(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-tactical block mb-1.5">Effective Date</label>
              <input
                type="date"
                required
                value={editEffectiveDate}
                onChange={(e) => setEditEffectiveDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-tactical block mb-1.5">Allowances (JSON)</label>
              <input
                type="text"
                value={editAllowances}
                onChange={(e) => setEditAllowances(e.target.value)}
                className="input-field font-mono text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-tactical block mb-1.5">Deductions (JSON)</label>
              <input
                type="text"
                value={editDeductions}
                onChange={(e) => setEditDeductions(e.target.value)}
                className="input-field font-mono text-xs"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={editSubmitting} className="btn-primary text-xs">
              {editSubmitting ? "Updating..." : "Update Salary"}
            </button>
            <button type="button" onClick={cancelEdit} className="btn-ghost text-xs">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Salary table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Payroll</h2>
          {!showForm && !editingId && (
            <button onClick={openCreateForm} className="btn-primary text-xs">
              + Add Salary
            </button>
          )}
        </div>

        {salaries.length === 0 ? (
          <p className="text-xs text-foreground-muted">No salary records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-foreground-muted border-b border-surface-border">
                  <th className="pb-2 font-medium label-tactical">Employee</th>
                  <th className="pb-2 font-medium label-tactical">Emp. ID</th>
                  <th className="pb-2 font-medium label-tactical">Base Salary</th>
                  <th className="pb-2 font-medium label-tactical">Allowances</th>
                  <th className="pb-2 font-medium label-tactical">Deductions</th>
                  <th className="pb-2 font-medium label-tactical">Net Salary</th>
                  <th className="pb-2 font-medium label-tactical">Effective</th>
                  <th className="pb-2 font-medium label-tactical"></th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((s) => (
                  <tr key={s.id} className="border-b border-surface-border last:border-0 hover:bg-surface-overlay bg-surface-raised">
                    <td className="py-2.5 text-foreground-primary font-medium">
                      {s.user?.profile?.fullName || "---"}
                    </td>
                    <td className="py-2.5 text-foreground-muted font-mono">{s.user?.employeeId || s.employeeId}</td>
                    <td className="py-2.5 text-foreground-primary">{formatCurrency(s.baseSalary)}</td>
                    <td className="py-2.5 text-success">
                      +{formatCurrency(Object.values(s.allowances).reduce((a, b) => a + b, 0))}
                    </td>
                    <td className="py-2.5 text-danger">
                      -{formatCurrency(Object.values(s.deductions).reduce((a, b) => a + b, 0))}
                    </td>
                    <td className="py-2.5 text-foreground-primary font-medium">{formatCurrency(s.netSalary)}</td>
                    <td className="py-2.5 text-foreground-muted font-mono">{formatDate(s.effectiveDate)}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          onClick={() => startEdit(s)}
                          className="label-tactical text-accent hover:text-accent-hover"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await triggerPayslipDownload(
                                `/api/payroll/me/payslip?employeeId=${s.employeeId}`,
                                `payslip-${s.employeeId}.pdf`
                              );
                            } catch {
                              /* best-effort */
                            }
                          }}
                          className="label-tactical text-foreground-muted hover:text-foreground-secondary"
                        >
                          Payslip
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main (role-aware) ──────────────────────────────────────────────────────

export default function PayrollPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <div className="min-h-screen"><Navbar /><LoadingSpinner /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="label-tactical mb-1">Payroll</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground-primary uppercase">
            {user.role === "ADMIN" ? "Payroll Management" : "My Payroll"}
          </h1>
        </div>

        {user.role === "ADMIN" ? <AdminPayroll /> : <EmployeePayroll />}
      </main>
    </div>
  );
}
