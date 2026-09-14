import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return <label className="relative inline-flex items-center"><Icon className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-muted-foreground" /><select aria-label="Colour theme" value={theme} onChange={(event) => setTheme(event.target.value as Theme)} className={`appearance-none rounded-md border border-border bg-card py-1.5 pr-2 pl-7 text-xs font-medium text-foreground outline-none hover:bg-secondary focus:ring-2 focus:ring-ring ${compact ? "w-9 text-transparent" : "w-24"}`}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>;
}
