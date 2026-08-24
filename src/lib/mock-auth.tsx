import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { ensureDemoAccount } from "@/lib/demo-auth.functions";

export type Role = "super_admin" | "faculty";


export type DemoUser = {
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  department: string;
};

const ACCOUNTS: Array<DemoUser & { password: string }> = [
  {
    name: "Dr. A. Kulkarni",
    email: "superadmin@obe-demo.com",
    password: "Admin@123",
    role: "super_admin",
    roleLabel: "Super Admin",
    department: "Institution Administration",
  },
  {
    name: "Prof. S. Deshmukh",
    email: "faculty@obe-demo.com",
    password: "Faculty@123",
    role: "faculty",
    roleLabel: "Faculty",
    department: "Information Technology",
  },
];

const STORAGE_KEY = "obe-demo-session";

type AuthContextValue = {
  user: DemoUser | null;
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<DemoUser | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let stored: DemoUser | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw) as DemoUser;
    } catch {
      // ignore corrupt demo session
    }
    if (!stored) {
      setHydrated(true);
      return;
    }
    setUser(stored);
    // Re-establish the backend session so database reads/writes are authorised.
    const account = ACCOUNTS.find((a) => a.email === stored?.email);
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (data.session || !account) return;
        await supabase.auth.signInWithPassword({ email: account.email, password: account.password });
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const match = ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
    );
    if (!match) return null;

    // Demo accounts are provisioned on demand in the backend, then signed in for real
    // so row-level security recognises the user and their role.
    await ensureDemoAccount({
      data: { email: match.email, password: match.password, role: match.role },
    });
    const { error } = await supabase.auth.signInWithPassword({
      email: match.email,
      password: match.password,
    });
    if (error) throw error;

    const { password: _pw, ...session } = match;
    setUser(session);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
    await supabase.auth.signOut();
  }, []);


  const value = useMemo(() => ({ user, hydrated, signIn, signOut }), [user, hydrated, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
