"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function SignUpPage() {
  const router = useRouter();
  const { signup, sendOtp, verifyOtp } = useAuth();
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

  // OTP flow state
  const [signupComplete, setSignupComplete] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [createdLoginId, setCreatedLoginId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const focusOtpInput = useCallback((index: number) => {
    if (index >= 0 && index < 6) {
      otpInputRefs.current[index]?.focus();
    }
  }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await signup({
        companyName,
        name,
        email,
        phone: phone || undefined,
        password,
        confirmPassword,
      });
      setCreatedUserId(result.userId);
      setCreatedLoginId(result.loginId);
      setSignupComplete(true);
      setSuccess(`Account created! Your Login ID is: ${result.loginId}`);

      // Auto-send OTP
      setOtpSending(true);
      try {
        await sendOtp(result.userId);
        setOtpSent(true);
        setSuccess(`Account created! Your Login ID is: ${result.loginId}\nOTP has been sent to ${email}`);
        startCountdown();
      } catch {
        setSuccess(`Account created! Your Login ID is: ${result.loginId}\nFailed to send OTP. Click "Resend OTP" to try again.`);
      } finally {
        setOtpSending(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  function startCountdown() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setOtpCountdown(60);
    countdownRef.current = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResendOtp() {
    if (!createdUserId || otpCountdown > 0) return;
    setOtpSending(true);
    setError(null);
    try {
      await sendOtp(createdUserId);
      setOtpSent(true);
      setSuccess(`OTP resent to ${email}`);
      startCountdown();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setOtpSending(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!createdUserId || otp.length !== 6) return;
    setOtpLoading(true);
    setError(null);
    try {
      await verifyOtp(createdUserId, otp);
      setVerified(true);
      setSuccess("Email verified successfully! Redirecting to sign in...");
      setTimeout(() => router.push("/signin"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    const val = value.replace(/\D/g, "");
    const newOtp = otp.split("");
    newOtp[index] = val;
    const updated = newOtp.join("").slice(0, 6);
    setOtp(updated);
    if (val && index < 5) {
      focusOtpInput(index + 1);
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      focusOtpInput(index - 1);
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      setOtp(pasted);
      focusOtpInput(Math.min(pasted.length, 5));
    }
  }

  return (
    <div className="min-h-screen relative z-10 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-lg p-6 backdrop-blur-xl bg-black/60 border border-white/10">
        {/* Logo */}
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

        {success && (
          <div className="mb-4 p-3 bg-success/10 border border-success/20 text-success text-sm rounded whitespace-pre-wrap">
            {success}
          </div>
        )}

        {/* ─── Signup Form ─── */}
        {!signupComplete && (
          <form onSubmit={handleSignup}>
            <div className="space-y-4">
              {/* Company Name */}
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

              {/* Password */}
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

              {/* Confirm Password */}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 bg-accent hover:bg-accent-hover text-surface-base font-bold text-sm rounded transition-colors shadow-none"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
        )}

        {/* ─── OTP Verification Section ─── */}
        {signupComplete && !verified && (
          <div className="mt-4 space-y-4">
            {/* Login ID display - always visible after signup */}
            {createdLoginId && (
              <div className="p-3 bg-accent/10 border border-accent/20 rounded">
                <p className="text-xs text-foreground-muted">Your Login ID</p>
                <p className="text-sm font-mono font-bold text-accent">{createdLoginId}</p>
              </div>
            )}

            {otpSending && (
              <div className="flex items-center gap-3 p-3 bg-surface-overlay border border-surface-border rounded text-sm text-foreground-secondary">
                <svg className="w-4 h-4 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending OTP to {email}...
              </div>
            )}

            {otpSent && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-3">
                    <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-foreground-primary">Verify your email</h3>
                  <p className="text-xs text-foreground-muted mt-1">
                    Enter the 6-digit code sent to <span className="text-foreground-secondary font-medium">{email}</span>
                  </p>
                </div>

                {/* OTP Input - individual digit boxes with refs */}
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      ref={(el) => { otpInputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[i] || ""}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-12 text-center text-lg font-mono font-bold bg-[#121212] border border-surface-border rounded focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                      required
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className="w-full py-3 bg-accent hover:bg-accent-hover text-surface-base font-bold text-sm rounded transition-colors shadow-none"
                >
                  {otpLoading ? "Verifying..." : "Verify OTP"}
                </button>

                {/* Resend OTP */}
                <div className="text-center">
                  {otpCountdown > 0 ? (
                    <p className="text-xs text-foreground-muted">
                      Resend OTP in <span className="text-foreground-secondary font-medium">{otpCountdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpSending}
                      className="text-xs text-accent hover:text-accent-hover transition-colors"
                    >
                      {otpSending ? "Sending..." : "Resend OTP"}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* ─── Link to Sign In ─── */}
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
