import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { Link } from "@/lib/navigation";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { getNotificationRoute } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { session } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } =
    useStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const recipientId = session?.accountId ?? "";
  const unreadCount = getUnreadCount(recipientId);

  const myNotifications = notifications
    .filter((n) => n.recipientId === recipientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  if (!session) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsRead(recipientId)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-80">
            {myNotifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            )}
            {myNotifications.map((n) => {
              const route = getNotificationRoute(n);
              const content = (
                <div
                  key={n.id}
                  className={cn(
                    "border-b border-border px-4 py-3 transition-colors hover:bg-secondary/50",
                    !n.read && "bg-primary/5",
                  )}
                  onClick={() => {
                    markNotificationRead(n.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm", !n.read ? "font-semibold" : "font-medium")}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">
                        {new Date(n.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );

              if (route) {
                return (
                  <Link key={n.id} to={route.to} params={route.params} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                );
              }
              return <div key={n.id}>{content}</div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
