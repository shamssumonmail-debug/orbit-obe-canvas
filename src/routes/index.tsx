import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Lock, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/mock-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in · OBE Suite — Outcome Based Education Platform" },
      {
        name: "description",
        content:
          "Sign in to OBE Suite, an outcome based education platform for PO/CO mapping, attainment analytics and accreditation readiness.",
      },
      { property: "og:title", content: "Sign in · OBE Suite" },
      {
        property: "og:description",
        content: "Outcome Based Education platform for program outcomes, course outcomes and attainment analytics.",
      },
    ],
  }),
  component: LoginPage,
});

const DEMO = {
  super_admin: { email: "superadmin@obe-demo.com", password: "Admin@123" },
  faculty: { email: "faculty@obe-demo.com", password: "Faculty@123" },
};

function LoginPage() {
  const { signIn, user, hydrated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"super_admin" | "faculty">("super_admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    if (hydrated && user) navigate({ to: "/dashboard" });
  }, [hydrated, user, navigate]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const session = await signIn(email, password);
      if (!session) {
        toast.error("Invalid credentials — use demo accounts shown on this page");
        return;
      }
      toast.success(`Welcome back, ${session.name}`);
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  };


  const prefill = (role: "super_admin" | "faculty") => {
    setTab(role);
    setEmail(DEMO[role].email);
    setPassword(DEMO[role].password);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(650px circle at 15% 10%, oklch(0.6 0.17 254 / 0.55), transparent 60%), radial-gradient(600px circle at 85% 85%, oklch(0.55 0.2 300 / 0.35), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            OBE
          </div>
          <div>
            <p className="text-sm font-semibold">OBE Suite</p>
            <p className="text-xs text-sidebar-foreground/60">Outcome Based Education platform</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Outcomes, attainment and accreditation in one workspace.
          </h2>
          <p className="mt-4 text-sm text-sidebar-foreground/70">
            Define program and course outcomes, map CO-PO relationships, and track attainment across cohorts with
            audit-ready analytics.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-sidebar-foreground/80">
            {[
              { icon: GraduationCap, text: "PO / PSO / PEO frameworks per program" },
              { icon: ShieldCheck, text: "NAAC & NBA ready outcome documentation" },
              { icon: Lock, text: "Role scoped access for admins and faculty" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-sidebar-accent">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-foreground/50">Structural MVP preview · mock data only</p>
      </section>

      <section className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              OBE
            </div>
            <p className="font-semibold">OBE Suite</p>
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight">Sign in to your institution</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a role and continue with the demo credentials.</p>

          <Tabs value={tab} onValueChange={(v) => prefill(v as "super_admin" | "faculty")} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="super_admin">Super Admin</TabsTrigger>
              <TabsTrigger value="faculty">Faculty</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email or username</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  autoComplete="username"
                  placeholder="you@institution.edu"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => toast.info("Password recovery arrives with the backend milestone")}
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              Sign in
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demo access</p>
            <div className="mt-3 space-y-2 text-sm">
              <button
                type="button"
                onClick={() => prefill("super_admin")}
                className="flex w-full items-center justify-between rounded-lg bg-secondary px-3 py-2 text-left transition-colors hover:bg-accent"
              >
                <span className="font-medium">Super Admin</span>
                <span className="font-mono text-xs text-muted-foreground">
                  superadmin@obe-demo.com / Admin@123
                </span>
              </button>
              <button
                type="button"
                onClick={() => prefill("faculty")}
                className="flex w-full items-center justify-between rounded-lg bg-secondary px-3 py-2 text-left transition-colors hover:bg-accent"
              >
                <span className="font-medium">Faculty</span>
                <span className="font-mono text-xs text-muted-foreground">faculty@obe-demo.com / Faculty@123</span>
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Click a row to auto-fill the form.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
