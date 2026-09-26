import { Link, useRouterState, useNavigate } from "@/lib/navigation";
import { Printer, Home, Package, User, LifeBuoy, Store, LogOut } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ThemeSelector } from "@/components/ThemeSelector";
import { NotificationBell } from "@/components/NotificationBell";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/order", label: "New Order", icon: Printer },
  { to: "/orders", label: "My Orders", icon: Package },
  { to: "/support", label: "Support", icon: LifeBuoy },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function CustomerShell({
  children,
  hideFooter = false,
}: {
  children: ReactNode;
  hideFooter?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { session, signOut } = useAuth();

  // Customer access control: redirect incomplete registration back to register page.
  // Since the register page now auto-completes and redirects to /, this rarely triggers.
  useEffect(() => {
    if (!session || session.role !== "customer") return;
    if (session.registrationStatus === "incomplete" && pathname !== "/auth/customer/register") {
      navigate({ to: "/auth/customer/register", replace: true });
    }
  }, [session, navigate, pathname]);

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          {/* <Link to="/" className="flex items-center gap-2">
            {/* <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Printer className="h-5 w-5" />
            </span>
            <span className="text-[15px] font-bold tracking-tight">XEROXMATE</span> 

          </Link> */}
          {/* <Link to="/" className="flex items-center">
            {/* Light theme logo *
            <img
              src="/logo-light-rbg.png"
              alt="XEROXMATE"
              className="h-16 dark:hidden"
            />

            {/* Dark theme logo *
            <img
              src="/logo-dark-rbg.png"
              alt="XEROXMATE"
              className="hidden h-16 dark:block"
            />
          </Link> */}
          <Link to="/" className="flex items-center">
            {/* Light theme logo */}
            <img
              src="/logo-light-rbg.png"
              alt="XEROXMATE"
              className="h-16 dark:hidden"
            />

            {/* Dark theme logo */}
            <img
              src="/logo-dark-rbg.png"
              alt="XEROXMATE"
              className="hidden h-16 dark:block"
            />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.to)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeSelector compact />
            <Link
              to={session?.role === "shopkeeper" ? "/shop" : "/auth/shop/login"}
              className="hidden md:block"
            >
              <Button variant="outline" size="sm">
                <Store className="h-4 w-4" /> Shopkeeper
              </Button>
            </Link>
            {session?.role === "customer" ? (
              <button
                onClick={signOut}
                className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary sm:inline-flex"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            ) : (
              <Link to="/auth/customer/login" className="hidden sm:block">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {!hideFooter && (
        <footer className="mt-5 hidden border-t border-border bg-card md:block">
          <div className="container-page flex flex-col gap-2 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} XEROXMATE · Print smarter, skip the queue.</p>
            <div className="flex gap-4">

              <Link
                to="/footerfile/terms"
                className="block text-sm text-slate-400 transition hover:text-white"
              >
                Terms & Conditions
              </Link>

              <Link
                to="/footerfile/privacy"
                className="block text-sm text-slate-400 transition hover:text-white"
              >
                Privacy Policy
              </Link>

              <Link
                to="/footerfile/refund-policy"
                className="block text-sm text-slate-400 transition hover:text-white"
              >
                Refund / Cancellation Policy
              </Link>
              <Link to="/support" className="hover:text-foreground">
                Support
              </Link>
              <Link to="/settings" className="hover:text-foreground">
                Settings
              </Link>

            </div>
          </div>
        </footer>
      )}

      <nav className="fixed inset-x-0 bottom-0  z-40 border-t border-border bg-card md:hidden">
        <div className="grid grid-cols-5">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                isActive(item.to) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="container-page flex flex-wrap items-end justify-between gap-4 pt-8 pb-6 md:pt-12">
      <div>
        <h1 className="text-page-title font-bold">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
