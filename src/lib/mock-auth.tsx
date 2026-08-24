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
  signIn: (email: string, password: string) => DemoUser | null;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as DemoUser);
    } catch {
      // ignore corrupt demo session
    }
    setHydrated(true);
  }, []);

  const signIn = useCallback((email: string, password: string) => {
    const match = ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
    );
    if (!match) return null;
    const { password: _pw, ...session } = match;
    setUser(session);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(() => ({ user, hydrated, signIn, signOut }), [user, hydrated, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
