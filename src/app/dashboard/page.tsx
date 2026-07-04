"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        router.replace("/employees");
      } else {
        router.replace("/");
      }
    }
  }, [user, authLoading, router]);

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
