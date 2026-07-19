'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardPageShell } from "@/components/shared/dashboard-page-shell";
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Edit3,
} from "lucide-react";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMs < 60000) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getIconForType(type: string) {
  switch (type) {
    case "inquiry":
    case "new_message":
      return MessageSquare;
    case "verification":
      return ShieldCheck;
    case "engagement":
      return CheckCircle2;
    case "listing_update":
      return Edit3;
    case "system":
    default:
      return Bell;
  }
}

export default function BuyerNotificationsPage() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = React.useState(false);

  const fetchNotifications = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/notifications?limit=100");
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to load notifications");
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("[BUYER-NOTIFICATIONS] Error fetching notifications:", err);
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = React.useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: id }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
    } catch (err) {
      console.error("[BUYER-NOTIFICATIONS] Error marking as read:", err);
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
      );
    }
  }, []);

  const markAllAsRead = React.useCallback(async () => {
    const previous = notifications;
    setIsMarkingAll(true);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }
    } catch (err) {
      console.error("[BUYER-NOTIFICATIONS] Error marking all as read:", err);
      setNotifications(previous);
    } finally {
      setIsMarkingAll(false);
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const headerActions = (
    <Button
      variant="outline"
      size="sm"
      onClick={markAllAsRead}
      disabled={isLoading || isMarkingAll || unreadCount === 0}
    >
      {isMarkingAll ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CheckCheck className="mr-2 h-4 w-4" />
      )}
      Mark all as read
    </Button>
  );

  return (
    <DashboardPageShell
      title="Notifications"
      description="Stay updated with important alerts and messages related to your activity."
      actions={headerActions}
    >
      <div className="flex-1 min-h-0 border overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <p className="text-lg font-semibold text-foreground">Something went wrong</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchNotifications}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold text-foreground">No notifications yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Important updates and alerts will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((notification) => {
            const Icon = getIconForType(notification.type);
            const rowInner = (
              <>
                <div
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    notification.is_read ? "bg-transparent" : "bg-primary"
                  }`}
                  aria-hidden="true"
                />
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm ${
                      notification.is_read
                        ? "text-muted-foreground"
                        : "font-semibold text-foreground"
                    }`}
                  >
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTimestamp(notification.created_at)}
                  </p>
                </div>
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      markAsRead(notification.id);
                    }}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Mark read
                  </Button>
                )}
              </>
            );

            const rowClasses = `flex items-start gap-3 border-b px-4 py-4 transition-colors ${
              notification.is_read ? "bg-transparent" : "border-l-2 border-l-primary bg-primary/5"
            } ${notification.link ? "hover:bg-muted/50" : ""}`;

            if (notification.link) {
              return (
                <Link
                  key={notification.id}
                  href={notification.link}
                  className={rowClasses}
                  onClick={() => {
                    if (!notification.is_read) markAsRead(notification.id);
                  }}
                >
                  {rowInner}
                </Link>
              );
            }

            return (
              <div key={notification.id} className={rowClasses}>
                {rowInner}
              </div>
            );
          })}
          </div>
        )}
      </div>
    </DashboardPageShell>
  );
}
