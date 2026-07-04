"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";

interface EmployeeDetail {
  id: string;
  employeeId: string;
  email: string;
  role: string;
  createdAt: string;
  profile: {
    fullName: string;
    phone: string | null;
    address: string | null;
    jobTitle: string | null;
    department: string | null;
    profilePictureUrl: string | null;
  } | null;
}

type Tab = "resume" | "private";

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tab, setTab] = useState<Tab>("resume");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

  useEffect(() => {
    async function fetchEmployee() {
      try {
        const data = await apiFetch<{ users: EmployeeDetail[] }>("/api/employees");
        const emp = data.users.find((u) => u.id === id);
        if (emp) {
          setEmployee(emp);
          setFullName(emp.profile?.fullName || "");
          setPhone(emp.profile?.phone || "");
          setAddress(emp.profile?.address || "");
          setJobTitle(emp.profile?.jobTitle || "");
          setDepartment(emp.profile?.department || "");
          setProfilePictureUrl(emp.profile?.profilePictureUrl || "");
        }
      } catch {} finally { setLoading(false); }
    }
    fetchEmployee();
  }, [id]);

  async function handleSave() {
    setSaving(true); setMessage(null);
    try {
      await apiFetch(`/api/employees/${id}`, {
        method: "PATCH",
        body: { fullName: fullName || undefined, phone: phone || undefined, address: address || undefined, jobTitle: jobTitle || undefined, department: department || undefined, profilePictureUrl: profilePictureUrl || undefined },
      });
      setEmployee((prev) => prev ? { ...prev, profile: { ...prev.profile!, fullName, phone: phone || null, address: address || null, jobTitle: jobTitle || null, department: department || null, profilePictureUrl: profilePictureUrl || null } } : prev);
      setEditing(false);
      setMessage({ type: "success", text: "Profile updated." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen bg-surface-base"><Navbar /><LoadingSpinner /></div>;
  if (!employee) return <div className="min-h-screen bg-surface-base"><Navbar /><div className="max-w-4xl mx-auto p-8 text-center text-foreground-muted">Employee not found.</div></div>;

  const initials = (employee.profile?.fullName || employee.email)[0]?.toUpperCase() || "?";
  const isOwner = user?.id === employee.id;
  const canEdit = user?.role === "ADMIN" || isOwner;

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header: avatar + name + details */}
        <div className="flex items-start gap-6 mb-8">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-surface-overlay flex items-center justify-center font-heading text-2xl font-bold text-accent overflow-hidden border-2 border-surface-border">
              {employee.profile?.profilePictureUrl ? (
                <img src={employee.profile.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : initials}
            </div>
            {canEdit && (
              <button onClick={() => setEditing(true)} className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs hover:bg-accent-hover transition-colors" title="Edit">
                ✎
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground-primary">{employee.profile?.fullName || "No Name"}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mt-3">
              <div>
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Company</p>
                <p className="text-sm text-foreground-primary">WorkFrame</p>
              </div>
              <div>
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Position</p>
                <p className="text-sm text-foreground-primary">{employee.profile?.jobTitle || "---"}</p>
              </div>
              <div>
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Department</p>
                <p className="text-sm text-foreground-primary">{employee.profile?.department || "---"}</p>
              </div>
              <div>
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Email</p>
                <p className="text-sm text-foreground-primary truncate">{employee.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex border-b border-surface-border mb-6">
          <button onClick={() => setTab("resume")} className={`px-5 py-2.5 text-sm font-medium transition-colors ${tab === "resume" ? "text-accent border-b-2 border-accent" : "text-foreground-muted hover:text-foreground-secondary"}`}>Resume</button>
          <button onClick={() => setTab("private")} className={`px-5 py-2.5 text-sm font-medium transition-colors ${tab === "private" ? "text-accent border-b-2 border-accent" : "text-foreground-muted hover:text-foreground-secondary"}`}>Private Info</button>
        </div>

        {message && (
          <div className={`mb-4 p-3 text-sm ${message.type === "success" ? "bg-success/10 border border-success/20 text-success" : "bg-danger/10 border border-danger/20 text-danger"}`}>{message.text}</div>
        )}

        {/* Resume Tab */}
        {tab === "resume" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h3 className="text-sm font-semibold text-foreground-primary mb-2">About</h3>
                <p className="text-sm text-foreground-secondary">Employee at WorkFrame.</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-semibold text-foreground-primary mb-2">Interests &amp; Hobbies</h3>
                <p className="text-sm text-foreground-secondary">---</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-sm font-semibold text-foreground-primary mb-3">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {["Communication", "Teamwork", "Problem Solving"].map((s, i) => (
                    <span key={i} className="px-2 py-1 text-xs bg-surface-overlay text-foreground-secondary border border-surface-border">{s}</span>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 className="text-sm font-semibold text-foreground-primary mb-3">Certifications</h3>
                <p className="text-xs text-foreground-muted">No certifications added.</p>
              </div>
            </div>
          </div>
        )}

        {/* Private Info Tab */}
        {tab === "private" && (
          <div className="card">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider border-b border-surface-border pb-2">Personal Details</h3>
                <div><label className="text-[10px] text-foreground-muted uppercase block mb-1">Phone</label>
                  {editing ? <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field text-sm w-full" /> : <p className="text-sm text-foreground-primary">{employee.profile?.phone || "---"}</p>}
                </div>
                <div><label className="text-[10px] text-foreground-muted uppercase block mb-1">Address</label>
                  {editing ? <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="input-field text-sm w-full" /> : <p className="text-sm text-foreground-primary">{employee.profile?.address || "---"}</p>}
                </div>
                <div><label className="text-[10px] text-foreground-muted uppercase block mb-1">Email</label><p className="text-sm text-foreground-primary">{employee.email}</p></div>
                <div><label className="text-[10px] text-foreground-muted uppercase block mb-1">Employee Code</label><p className="text-sm text-foreground-primary font-mono">{employee.employeeId}</p></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider border-b border-surface-border pb-2">Work Details</h3>
                <div><label className="text-[10px] text-foreground-muted uppercase block mb-1">Role</label><p className="text-sm text-foreground-primary uppercase">{employee.role}</p></div>
                <div><label className="text-[10px] text-foreground-muted uppercase block mb-1">Member Since</label><p className="text-sm text-foreground-primary font-mono">{new Date(employee.createdAt).toLocaleDateString()}</p></div>
                {editing && (
                  <>
                    <div><label className="text-[10px] text-foreground-muted uppercase block mb-1">Job Title</label><input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="input-field text-sm w-full" /></div>
                    <div><label className="text-[10px] text-foreground-muted uppercase block mb-1">Department</label><input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="input-field text-sm w-full" /></div>
                    <div><label className="text-[10px] text-foreground-muted uppercase block mb-1">Profile Picture URL</label><input type="url" value={profilePictureUrl} onChange={(e) => setProfilePictureUrl(e.target.value)} className="input-field text-sm w-full" /></div>
                  </>
                )}
              </div>
            </div>
            {editing && (
              <div className="border-t border-surface-border mt-6 pt-4 flex gap-3">
                <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50 text-sm">{saving ? "Saving..." : "Save Changes"}</button>
                <button onClick={() => { setEditing(false); setMessage(null); setFullName(employee.profile?.fullName || ""); setPhone(employee.profile?.phone || ""); setAddress(employee.profile?.address || ""); setJobTitle(employee.profile?.jobTitle || ""); setDepartment(employee.profile?.department || ""); setProfilePictureUrl(employee.profile?.profilePictureUrl || ""); }} className="px-4 py-2 text-sm font-medium text-foreground-secondary border border-surface-border hover:bg-surface-overlay rounded">Cancel</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
