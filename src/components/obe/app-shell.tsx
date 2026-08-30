import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, Menu, PanelLeftClose, Search, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/mock-auth";
import { sectionsForRole } from "@/lib/obe-nav";
import { useInstitution, useLogoUrl } from "@/lib/institution";
import { useMyProfile } from "@/lib/profile";

function Brand({ compact = false }: { compact?: boolean }) {
  const { data: institution } = useInstitution();
  const logoUrl = useLogoUrl(institution?.logo_url);
  return (
    <div className="flex items-center gap-3 px-4 py-5">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${institution?.name ?? "Institution"} logo`}
          className="size-9 shrink-0 rounded-lg bg-sidebar-primary-foreground object-contain p-0.5"
        />
      ) : (
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          OBE
        </div>
      )}
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">OBE Suite</p>
          <p className="truncate text-xs text-sidebar-foreground/60">{institution?.code ?? "—"}</p>
        </div>
      )}
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!user) return null;

  return (
    <nav className="flex-1 overflow-y-auto px-2 pb-6">
      {sectionsForRole(user.role).map((section) => (
        <div key={section.title} className="mb-5">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
            {section.title}
          </p>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const active = item.to ? pathname.startsWith(item.to) : false;
              const Icon = item.icon;
              if (!item.to) {
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() => toast.info(`${item.label} — coming soon in the next milestone`)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-sidebar-foreground/45 transition-colors hover:bg-sidebar-accent/50"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      <span className="rounded-full border border-sidebar-border px-1.5 py-0.5 text-[10px] uppercase">
                        Soon
                      </span>
                    </button>
                  </li>
                );
              }
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const { data: institution } = useInstitution();
  const { data: profile } = useMyProfile();
  const displayName = profile?.full_name?.trim() || user?.name || "";
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const handleSignOut = () => {
    void signOut();
    toast.success("Signed out of the demo session");
    navigate({ to: "/" });
  };


  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
          desktopOpen ? "w-64" : "w-0 overflow-hidden",
        )}
      >
        <Brand />
        <NavList />
        <div className="border-t border-sidebar-border px-4 py-3 text-[11px] text-sidebar-foreground/50">
          Structural MVP · mock data
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-full flex-col">
            <Brand />
            <NavList onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              onClick={() => setDesktopOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              <PanelLeftClose className={cn("size-5 transition-transform", !desktopOpen && "rotate-180")} />
            </Button>

            <div className="relative hidden max-w-xs flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search courses, outcomes…" className="pl-9" />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {institution?.academic_year ?? "—"} · {institution?.term ?? "—"}
              </Badge>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="size-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                      {displayName.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="hidden text-left sm:block">
                      <span className="block text-sm font-medium leading-tight">{displayName}</span>
                      <span className="block text-xs leading-tight text-muted-foreground">{user?.roleLabel}</span>
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    {user?.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings/profile">
                      <UserCog className="mr-2 size-4" /> Profile settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleSignOut}>
                    <LogOut className="mr-2 size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-2 border-t border-border px-4 py-3 lg:px-6">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <p className="text-xs text-muted-foreground">{institution?.name ?? ""}</p>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-6">{children}</main>

        <footer className="border-t border-border bg-card px-4 py-4 text-xs text-muted-foreground lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} OBE Suite · Outcome Based Education platform</p>
            <p>MVP preview · charts and settings use mock data</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
