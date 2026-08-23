"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function SignInPage() {
  const router = useRouter();
  const { signin } = useAuth();
  const [loginIdOrEmail, setLoginIdOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen relative z-10 flex items-center justify-center px-4">
      {/* Narrower card — max-w-sm vs signup's max-w-lg */}
      <div className="w-full max-w-sm rounded-lg p-6 backdrop-blur-xl bg-black/60 border border-white/10">
        {/* Logo placeholder */}
        <div className="w-full h-16 bg-[#121212] border border-surface-border rounded flex items-center justify-center mb-6">
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

          {/* Sign In button — accent yellow, bold UPPERCASE */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-surface-base font-bold uppercase tracking-wider text-sm rounded transition-colors shadow-none"
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
