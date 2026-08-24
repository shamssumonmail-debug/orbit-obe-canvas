import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth, type Role } from "@/lib/mock-auth";

export function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) navigate({ to: "/" });
    else if (roles && !roles.includes(user.role)) navigate({ to: "/dashboard" });
  }, [hydrated, user, roles, navigate]);

  if (!hydrated || !user || (roles && !roles.includes(user.role))) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Loading workspace…</p>
      </div>
    );
  }

  return <>{children}</>;
}
