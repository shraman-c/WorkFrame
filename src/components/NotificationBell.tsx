"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count periodically
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiFetch<{ unreadCount: number }>(
        "/api/notifications/me?page=1&pageSize=1"
      );
      setUnreadCount(data.unreadCount);
    } catch {
      /* best-effort */
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    apiFetch<{ notifications: Notification[]; unreadCount: number }>(
      "/api/notifications/me?page=1&pageSize=10"
    )
      .then((data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, user]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAsRead(id: string) {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      /* best-effort */
    }
  }

  async function markAllRead() {
    try {
      await apiFetch("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* best-effort */
    }
  }

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-1.5 text-foreground-muted hover:text-foreground-primary hover:bg-surface-overlay transition-colors"
        title="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-danger text-white text-[8px] font-bold flex items-center justify-center rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-surface-raised border border-surface-border shadow-xl z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border">
            <span className="label-tactical text-foreground-primary">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="label-tactical text-accent hover:text-accent-hover"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-xs text-foreground-muted">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-foreground-muted">No notifications</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markAsRead(n.id);
                  }}
                  className={`w-full text-left px-3 py-2.5 border-b border-surface-border last:border-0 transition-colors hover:bg-surface-overlay ${
                    !n.isRead ? "bg-accent/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-accent flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground-secondary leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-foreground-muted font-mono mt-1">
                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
