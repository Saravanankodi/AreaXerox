import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ClipboardList, Printer, Store, Settings, ArrowLeft, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { ThemeSelector } from "@/components/ThemeSelector";

const nav = [
  { to: "/shop", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/shop/orders", label: "Orders", icon: ClipboardList },
  { to: "/shop/services", label: "Print Services", icon: Printer },
  { to: "/shop/profile", label: "Shop Profile", icon: Store },
  { to: "/shop/settings", label: "Settings", icon: Settings },
] as const;

export function ShopShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { activeShop } = useStore();
  const { session, signOut } = useAuth();

  if (session?.role !== "shopkeeper") {
    return <div className="flex min-h-screen items-center justify-center p-5"><div className="card-surface max-w-md p-7 text-center"><h1 className="text-xl font-bold">Shopkeeper sign-in required</h1><p className="mt-2 text-sm text-muted-foreground">Use your shop account to access orders, services and settings.</p><Link to="/auth/shop/login" className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Sign in to shop portal</Link></div></div>;
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="border-b border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-e lg:border-b-0">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Printer className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{activeShop.name}</p>
            <p className="text-xs text-muted-foreground">Shopkeeper console</p>
          </div>
          <span className="ml-auto"><ThemeSelector compact /></span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {nav.map((item) => {
            const active =
              "exact" in item && item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-3 pb-6 lg:block">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Customer app
          </Link>
          <button onClick={signOut} className="mt-1 flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-border bg-card">
          <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-6 md:px-8 md:py-8">
            <div>
              <h1 className="text-page-title font-bold">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {action}
          </div>
        </header>
        <div className="px-5 py-6 pb-16 md:px-8 md:py-8">{children}</div>
      </div>
    </div>
  );
}
