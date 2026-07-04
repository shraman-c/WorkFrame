"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function SignUpPage() {
  const router = useRouter();
  const { signup, loading: authLoading } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const msg = await signup({
        companyName,
        name,
        email,
        phone: phone || undefined,
        password,
        confirmPassword,
      });
      setSuccess(`${msg}\n\n[DEV] Check server console for verification token.`);
      // Redirect to sign in after short delay
      setTimeout(() => router.push("/signin"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4 py-8">
      {/* Wider card — max-w-lg */}
      <div className="w-full max-w-lg bg-surface-raised border border-surface-border rounded-lg p-6">
        {/* Logo placeholder */}
        <div className="w-full h-16 border border-surface-border rounded flex items-center justify-center mb-6">
          <span className="font-heading text-xl font-bold tracking-tight">
            <span className="text-accent">W</span><span className="text-foreground-primary">orkFrame</span>
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-success/10 border border-success/20 text-success text-sm rounded whitespace-pre-wrap">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Company Name with upload icon — two-column: label : input+icon */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-2">
              <label className="text-sm font-medium text-foreground-secondary text-right">
                Company Name :-
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Company Name"
                />
                <label className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center cursor-pointer transition-colors shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={() => {/* logo upload placeholder */}}
                  />
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </label>
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-2">
              <label className="text-sm font-medium text-foreground-secondary text-right">
                Name :-
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Full Name"
              />
            </div>

            {/* Email */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-2">
              <label className="text-sm font-medium text-foreground-secondary text-right">
                Email :-
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@company.com"
              />
            </div>

            {/* Phone */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-2">
              <label className="text-sm font-medium text-foreground-secondary text-right">
                Phone :-
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            {/* Password with eye toggle */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-2">
              <label className="text-sm font-medium text-foreground-secondary text-right">
                Password :-
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground-secondary"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password with eye toggle */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-2">
              <label className="text-sm font-medium text-foreground-secondary text-right">
                Confirm Password :-
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground-secondary"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sign Up button — purple/violet, sentence case (NOT uppercase) */}
          <button
            type="submit"
            disabled={loading}                className="w-full mt-6 py-3 bg-accent hover:bg-accent-hover text-surface-base font-bold text-sm rounded transition-colors disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Link to Sign In */}
        <p className="mt-6 text-center text-sm text-foreground-muted">
          Already have an account?{" "}
          <Link href="/signin" className="text-accent hover:text-accent-hover underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
