"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { setAccessToken, clearAccessToken, getAccessToken, apiFetch } from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  loginId: string;
  companyId: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signin: (loginIdOrEmail: string, password: string) => Promise<void>;
  signup: (data: {
    companyName: string;
    name: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
  }) => Promise<string>;
  verifyEmail: (token: string) => Promise<void>;
  signout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeAuth() {
      const token = getAccessToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload.exp * 1000 > Date.now()) {
            setUser({
              id: payload.id,
              email: payload.email,
              role: payload.role,
              loginId: payload.loginId || "",
              companyId: payload.companyId || "",
            });
            setLoading(false);
            return;
          }
        } catch {}
      }

      // Attempt silent refresh to restore session
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
          setUser(data.user);
        } else {
          clearAccessToken();
        }
      } catch {
        clearAccessToken();
      } finally {
        setLoading(false);
      }
    }
    initializeAuth();
  }, []);

  const signin = useCallback(async (loginIdOrEmail: string, password: string) => {
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginIdOrEmail, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Sign-in failed");
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const signup = useCallback(async (signupData: {
    companyName: string;
    name: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
  }) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signupData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    return data.message as string;
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Verification failed");
  }, []);

  const signout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/signout", { method: "POST" });
    } catch {
      // Best-effort — clear client state regardless
    }
    clearAccessToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signin, signup, verifyEmail, signout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
