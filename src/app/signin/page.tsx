"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function SignInPage() {
  const router = useRouter();
  const { signin, loading: authLoading } = useAuth();
  const [loginIdOrEmail, setLoginIdOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signin(loginIdOrEmail, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
      {/* Narrower card — max-w-sm vs signup's max-w-lg */}
      <div className="w-full max-w-sm bg-surface-raised border border-surface-border rounded-lg p-6">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Login Id/Email */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">
              Login Id/Email :-
            </label>
            <input
              type="text"
              required
              value={loginIdOrEmail}
              onChange={(e) => setLoginIdOrEmail(e.target.value)}
              className="input-field"
              placeholder="Login ID or Email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">
              Password :-
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          {/* Sign In button — purple/violet, bold UPPERCASE */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-surface-base font-bold uppercase tracking-wider text-sm rounded transition-colors disabled:opacity-50"
          >
            {loading ? "Signing In..." : "SIGN IN"}
          </button>
        </form>

        {/* Link to Sign Up */}
        <p className="mt-6 text-center text-sm text-foreground-muted">
          Don&apos;t have an Account?{" "}
          <Link href="/signup" className="text-accent hover:text-accent-hover underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
