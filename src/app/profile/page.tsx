"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, getAccessToken } from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ProfileData {
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
    about: string | null;
    interests: string | null;
  } | null;
  documents: { id: string; fileUrl: string; type: string; uploadedAt: string }[];
}

type Tab = "resume" | "private" | "salary";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
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

  // Resume fields
  const [about, setAbout] = useState("");
  const [interests, setInterests] = useState("");
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);
  const [savingInterests, setSavingInterests] = useState(false);

  // Profile picture upload
  const profilePicRef = useRef<HTMLInputElement>(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [skills, setSkills] = useState<string[]>(["TypeScript", "React", "Node.js", "PostgreSQL", "Tailwind CSS"]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");

  // Document state
  const [documents, setDocuments] = useState<ProfileData["documents"]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apiFetch<ProfileData>("/api/me/profile");
        setProfile(data);
        setFullName(data.profile?.fullName || "");
        setPhone(data.profile?.phone || "");
        setAddress(data.profile?.address || "");
        setJobTitle(data.profile?.jobTitle || "");
        setDepartment(data.profile?.department || "");
        setProfilePictureUrl(data.profile?.profilePictureUrl || "");
        setAbout(data.profile?.about || "");
        setInterests(data.profile?.interests || "");
        setDocuments(data.documents || []);
      } catch { /* handle silently */ } finally { setLoading(false); }
    }
    fetchProfile();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiFetch<{ fullName: string; phone: string | null; address: string | null; jobTitle: string | null; department: string | null; profilePictureUrl: string | null }>("/api/me/profile", {
        method: "PATCH",
        body: { fullName: fullName || undefined, phone, address, jobTitle: jobTitle || undefined, department: department || undefined, profilePictureUrl: profilePictureUrl || undefined },
      });
      setProfile((prev) => (prev ? { ...prev, profile: { ...prev.profile!, ...updated } } : prev));
      setEditing(false);
      setMessage({ type: "success", text: "Profile updated." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally { setSaving(false); }
  }

  async function handleFileUpload(file: File, type: "RESUME" | "CERTIFICATE") {
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      const token = getAccessToken();
      const res = await fetch("/api/me/documents/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setDocuments((prev) => [data, ...prev]);
      setMessage({ type: "success", text: `${type === "RESUME" ? "Resume" : "Certificate"} uploaded.` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Upload failed" });
    } finally { setUploading(false); }
  }

  async function handleDeleteDocument(docId: string) {
    setDeletingId(docId);
    setMessage(null);
    try {
      await apiFetch(`/api/me/documents/${docId}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setMessage({ type: "success", text: "Document deleted." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Delete failed" });
    } finally { setDeletingId(null); }
  }

  async function handleSaveAbout() {
    setSavingAbout(true);
    setMessage(null);
    try {
      const updated = await apiFetch<{ about: string | null }>('/api/me/profile', {
        method: 'PATCH',
        body: { about: about || undefined },
      });
      setAbout(updated.about || '');
      setEditingAbout(false);
      setMessage({ type: 'success', text: 'About updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed' });
    } finally { setSavingAbout(false); }
  }

  async function handleSaveInterests() {
    setSavingInterests(true);
    setMessage(null);
    try {
      const updated = await apiFetch<{ interests: string | null }>('/api/me/profile', {
        method: 'PATCH',
        body: { interests: interests || undefined },
      });
      setInterests(updated.interests || '');
      setEditingInterests(false);
      setMessage({ type: 'success', text: 'Interests updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed' });
    } finally { setSavingInterests(false); }
  }

  async function handleProfilePictureUpload(file: File) {
    setUploadingPic(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = getAccessToken();
      const res = await fetch('/api/me/profile-picture', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setProfilePictureUrl(data.profilePictureUrl);
      setProfile((prev) => prev ? { ...prev, profile: { ...prev.profile!, profilePictureUrl: data.profilePictureUrl } } : prev);
      setMessage({ type: 'success', text: 'Profile picture updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed' });
    } finally { setUploadingPic(false); }
  }

  const resumeDocs = documents.filter((d) => d.type === "RESUME");
  const certDocs = documents.filter((d) => d.type === "CERTIFICATE");
  const canViewSalary = user?.role === "ADMIN" || profile?.id === user?.id;

  if (loading) return <div className="min-h-screen bg-surface-base"><Navbar /><LoadingSpinner /></div>;
  if (!profile) return <div className="min-h-screen bg-surface-base"><Navbar /><div className="max-w-4xl mx-auto p-8 text-center text-foreground-muted">Profile not found.</div></div>;

  const initials = (profile.profile?.fullName || profile.email)[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header: avatar + name + key-value block */}
        <div className="flex items-start gap-6 mb-8">
          {/* Avatar with upload button */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-surface-overlay flex items-center justify-center font-heading text-2xl font-bold text-accent overflow-hidden border-2 border-surface-border">
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
              {uploadingPic && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs">...</span>
                </div>
              )}
            </div>
            <button
              onClick={() => profilePicRef.current?.click()}
              disabled={uploadingPic}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-xs hover:bg-accent-hover transition-colors disabled:opacity-50"
              title="Upload profile picture"
            >
              {uploadingPic ? '...' : '📷'}
            </button>
            <input
              ref={profilePicRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleProfilePictureUpload(f);
                e.target.value = '';
              }}
            />
          </div>

          {/* Name + key-value details */}
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground-primary">
              {profile.profile?.fullName || "No Name"}
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mt-3">
              <div>
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Company</p>
                <p className="text-sm text-foreground-primary">WorkFrame</p>
              </div>
              <div>
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Position</p>
                <p className="text-sm text-foreground-primary">{profile.profile?.jobTitle || "---"}</p>
              </div>
              <div>
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Department</p>
                <p className="text-sm text-foreground-primary">{profile.profile?.department || "---"}</p>
              </div>
              <div>
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Email</p>
                <p className="text-sm text-foreground-primary truncate">{profile.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex border-b border-surface-border mb-6">
          <button
            onClick={() => setTab("resume")}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === "resume"
                ? "text-accent border-b-2 border-accent"
                : "text-foreground-muted hover:text-foreground-secondary"
            }`}
          >
            Resume
          </button>
          <button
            onClick={() => setTab("private")}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === "private"
                ? "text-accent border-b-2 border-accent"
                : "text-foreground-muted hover:text-foreground-secondary"
            }`}
          >
            Private Info
          </button>
          {canViewSalary && (
            <button
              onClick={() => setTab("salary")}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                tab === "salary"
                  ? "text-accent border-b-2 border-accent"
                  : "text-foreground-muted hover:text-foreground-secondary"
              }`}
            >
              Salary Info
            </button>
          )}
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-4 p-3 text-sm ${message.type === "success" ? "bg-success/10 border border-success/20 text-success" : "bg-danger/10 border border-danger/20 text-danger"}`}>
            {message.text}
          </div>
        )}

        {/* ═══ Resume Tab ═══ */}
        {tab === "resume" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: text blocks + resume PDF */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground-primary">About</h3>
                  {!editingAbout && (
                    <button onClick={() => setEditingAbout(true)} className="text-xs text-accent hover:text-accent-hover font-medium">Edit</button>
                  )}
                </div>
                {editingAbout ? (
                  <div className="space-y-2">
                    <textarea
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      rows={4}
                      className="input-field text-sm w-full"
                      placeholder="Tell us about yourself..."
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSaveAbout} disabled={savingAbout} className="btn-primary text-xs px-3 py-1">
                        {savingAbout ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => { setEditingAbout(false); setAbout(profile.profile?.about || ''); }} className="text-xs text-foreground-muted hover:text-foreground-secondary">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground-secondary leading-relaxed">{about || <span className="italic text-foreground-muted">Click Edit to add a bio.</span>}</p>
                )}
              </div>
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground-primary">Interests &amp; Hobbies</h3>
                  {!editingInterests && (
                    <button onClick={() => setEditingInterests(true)} className="text-xs text-accent hover:text-accent-hover font-medium">Edit</button>
                  )}
                </div>
                {editingInterests ? (
                  <div className="space-y-2">
                    <textarea
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      rows={3}
                      className="input-field text-sm w-full"
                      placeholder="Photography, Hiking, Reading..."
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSaveInterests} disabled={savingInterests} className="btn-primary text-xs px-3 py-1">
                        {savingInterests ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => { setEditingInterests(false); setInterests(profile.profile?.interests || ''); }} className="text-xs text-foreground-muted hover:text-foreground-secondary">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground-secondary leading-relaxed">{interests || <span className="italic text-foreground-muted">Click Edit to add your interests.</span>}</p>
                )}
              </div>

              {/* Resume PDF */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground-primary">Resume PDF</h3>
                  <button onClick={() => resumeInputRef.current?.click()} disabled={uploading} className="text-xs text-accent hover:text-accent-hover font-medium disabled:opacity-50">
                    {uploading ? "Uploading..." : "+ Upload"}
                  </button>
                  <input ref={resumeInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "RESUME"); e.target.value = ""; }} />
                </div>
                {resumeDocs.length === 0 ? (
                  <p className="text-xs text-foreground-muted">No resume uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {resumeDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-accent">📄</span>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-foreground-secondary hover:text-accent truncate">Resume</a>
                          <span className="text-[10px] text-foreground-muted font-mono">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                        <button onClick={() => handleDeleteDocument(doc.id)} disabled={deletingId === doc.id} className="text-[10px] text-danger hover:text-red-400 ml-2 disabled:opacity-50">
                          {deletingId === doc.id ? "..." : "Delete"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right column: skills + certifications */}
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground-primary">Skills</h3>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newSkill.trim()) {
                          setSkills([...skills, newSkill.trim()]);
                          setNewSkill("");
                        }
                      }}
                      placeholder="Add skill"
                      className="text-xs bg-transparent border-b border-surface-border text-foreground-primary placeholder:text-foreground-muted focus:outline-none focus:border-accent w-20"
                    />
                    <button
                      onClick={() => {
                        if (newSkill.trim()) {
                          setSkills([...skills, newSkill.trim()]);
                          setNewSkill("");
                        }
                      }}
                      className="text-xs text-accent hover:text-accent-hover font-medium"
                    >
                      + Add
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, i) => (
                    <span key={i} className="px-2 py-1 text-xs bg-surface-overlay text-foreground-secondary border border-surface-border">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground-primary">Certifications</h3>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newCert}
                      onChange={(e) => setNewCert(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newCert.trim()) {
                          setCertifications([...certifications, newCert.trim()]);
                          setNewCert("");
                        }
                      }}
                      placeholder="Add cert"
                      className="text-xs bg-transparent border-b border-surface-border text-foreground-primary placeholder:text-foreground-muted focus:outline-none focus:border-accent w-20"
                    />
                    <button
                      onClick={() => {
                        if (newCert.trim()) {
                          setCertifications([...certifications, newCert.trim()]);
                          setNewCert("");
                        }
                      }}
                      className="text-xs text-accent hover:text-accent-hover font-medium"
                    >
                      + Add
                    </button>
                  </div>
                </div>
                {certifications.length === 0 && certDocs.length === 0 ? (
                  <p className="text-xs text-foreground-muted">No certifications added yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {certifications.map((c, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-surface-overlay text-foreground-secondary border border-surface-border">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Certificate PDFs */}
                <div className="mt-3 border-t border-surface-border pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Certificate PDFs</p>
                    <button onClick={() => certInputRef.current?.click()} disabled={uploading} className="text-[10px] text-accent hover:text-accent-hover font-medium disabled:opacity-50">
                      {uploading ? "..." : "+ Upload"}
                    </button>
                    <input ref={certInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "CERTIFICATE"); e.target.value = ""; }} />
                  </div>
                  {certDocs.length === 0 ? (
                    <p className="text-[10px] text-foreground-muted">No certificate PDFs uploaded.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {certDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-accent text-xs">📄</span>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-foreground-secondary hover:text-accent truncate">Certificate</a>
                            <span className="text-[10px] text-foreground-muted font-mono">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </div>
                          <button onClick={() => handleDeleteDocument(doc.id)} disabled={deletingId === doc.id} className="text-[10px] text-danger hover:text-red-400 ml-2 disabled:opacity-50">
                            {deletingId === doc.id ? "..." : "Delete"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Private Info Tab ═══ */}
        {tab === "private" && (
          <div className="card">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Left column — personal details */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider border-b border-surface-border pb-2">Personal Details</h3>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">Full Name</label>
                  {editing ? (
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field text-sm w-full" placeholder="Your full name" />
                  ) : (
                    <p className="text-sm text-foreground-primary">{profile.profile?.fullName || "---"}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">Address</label>
                  {editing ? (
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="input-field text-sm w-full" placeholder="Your address" />
                  ) : (
                    <p className="text-sm text-foreground-primary">{profile.profile?.address || "---"}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">Phone / Mobile</label>
                  {editing ? (
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field text-sm w-full" placeholder="+1 234 567 890" />
                  ) : (
                    <p className="text-sm text-foreground-primary">{profile.profile?.phone || "---"}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">Nationality</label>
                  <p className="text-sm text-foreground-primary">---</p>
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">Job Title</label>
                  {editing ? (
                    <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="input-field text-sm w-full" placeholder="Software Engineer" />
                  ) : (
                    <p className="text-sm text-foreground-primary">{profile.profile?.jobTitle || "---"}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">Department</label>
                  {editing ? (
                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="input-field text-sm w-full" placeholder="Engineering" />
                  ) : (
                    <p className="text-sm text-foreground-primary">{profile.profile?.department || "---"}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">Personal Email</label>
                  <p className="text-sm text-foreground-primary">{profile.email}</p>
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">Gender</label>
                  <p className="text-sm text-foreground-primary">---</p>
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">Marital Status</label>
                  <p className="text-sm text-foreground-primary">---</p>
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">Date of Joining</label>
                  <p className="text-sm text-foreground-primary font-mono">{new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Right column — bank details */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider border-b border-surface-border pb-2">Bank Details</h3>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">Account Number</label>
                  <p className="text-sm text-foreground-primary">---</p>
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">Bank Name</label>
                  <p className="text-sm text-foreground-primary">---</p>
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">IFSC Code</label>
                  <p className="text-sm text-foreground-primary">---</p>
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">PAN</label>
                  <p className="text-sm text-foreground-primary">---</p>
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">UAN</label>
                  <p className="text-sm text-foreground-primary">---</p>
                </div>
                <div>
                  <label className="text-[10px] text-foreground-muted uppercase block mb-1">Employee Code</label>
                  <p className="text-sm text-foreground-primary font-mono">{profile.employeeId}</p>
                </div>
              </div>
            </div>

            {/* Edit / Save buttons */}
            {editing && (
              <div className="border-t border-surface-border mt-6 pt-4 flex gap-3">
                <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50 text-sm">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFullName(profile.profile?.fullName || "");
                    setPhone(profile.profile?.phone || "");
                    setAddress(profile.profile?.address || "");
                    setJobTitle(profile.profile?.jobTitle || "");
                    setDepartment(profile.profile?.department || "");
                    setProfilePictureUrl(profile.profile?.profilePictureUrl || "");
                    setMessage(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-foreground-secondary border border-surface-border hover:bg-surface-overlay transition-colors rounded"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ Salary Info Tab ═══ */}
        {tab === "salary" && (
          <SalaryInfoTab />
        )}
      </main>
    </div>
  );
}

// ─── Salary Info sub-component ──────────────────────────────────────────────

function SalaryInfoTab() {
  const [salaryData, setSalaryData] = useState<{ current: { baseSalary: number; netSalary: number; allowances: Record<string, number>; deductions: Record<string, number> } | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/payroll/me")
      .then((data) => setSalaryData(data as { current: { baseSalary: number; netSalary: number; allowances: Record<string, number>; deductions: Record<string, number> } | null }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="sm" />;

  const current = salaryData?.current;
  if (!current) {
    return <div className="card text-center py-8"><p className="text-sm text-foreground-muted">No salary record found.</p></div>;
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);
  }

  const allComponents = [
    { name: "Base Salary", amount: current.baseSalary, unit: "/month", description: "Fixed monthly base pay" },
    ...Object.entries(current.allowances).map(([key, val]) => ({
      name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      amount: val,
      unit: "/month",
      description: `Monthly ${key.replace(/_/g, " ")} allowance`,
    })),
    ...Object.entries(current.deductions).map(([key, val]) => ({
      name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      amount: -val,
      unit: "/month",
      description: `Monthly ${key.replace(/_/g, " ")} deduction`,
    })),
  ];

  const yearlyWage = current.netSalary * 12;

  return (
    <div className="space-y-6">
      {/* Prominent wage fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Month Wage</p>
          <p className="font-heading text-2xl font-bold text-foreground-primary">{formatCurrency(current.netSalary)}</p>
        </div>
        <div className="card text-center">
          <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Yearly Wage</p>
          <p className="font-heading text-2xl font-bold text-foreground-primary">{formatCurrency(yearlyWage)}</p>
        </div>
      </div>

      {/* Salary components list */}
      <div className="card">
        <h3 className="text-sm font-semibold text-foreground-primary mb-4">Salary Components</h3>
        <div className="space-y-3">
          {allComponents.map((comp, i) => (
            <div key={i} className="flex items-start justify-between py-2 border-b border-surface-border last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground-primary">{comp.name}</p>
                <p className="text-xs text-foreground-muted mt-0.5">{comp.description}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className={`text-sm font-mono font-medium ${comp.amount >= 0 ? "text-foreground-primary" : "text-danger"}`}>
                  {comp.amount >= 0 ? formatCurrency(comp.amount) : `-${formatCurrency(Math.abs(comp.amount))}`}
                </p>
                <p className="text-[10px] text-foreground-muted">{comp.unit}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
