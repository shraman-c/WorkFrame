"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LoadingSpinner from "@/components/LoadingSpinner";

/**
 * Root page — redirects authenticated users to /dashboard,
 * and unauthenticated users to /signin.
 */
export default function RootPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/signin");
      }
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <LoadingSpinner />
      </div>
    );
  }

  return null;
}
