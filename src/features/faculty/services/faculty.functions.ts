import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  designation: z.string().optional().default(""),
  room_no: z.string().optional().default(""),
  department_id: z.string().uuid().nullable().optional(),
});

/**
 * Creates a faculty account and its staff record. Only a super admin or OBE
 * coordinator may call it — the check runs as the signed-in user (RLS applies)
 * before any privileged work happens.
 */
export const createFacultyMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: roles, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (roleError) throw roleError;

    const allowed = (roles ?? []).some((r) => r.role === "super_admin" || r.role === "obe_coordinator");
    if (!allowed) throw new Error("Only a super admin or OBE coordinator can add faculty");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
      password: `Aust@${Math.random().toString(36).slice(2, 10)}`,
      user_metadata: { full_name: data.full_name },
    });

    let userId = created.data.user?.id ?? null;

    if (!userId) {
      let page = 1;
      while (!userId && page <= 10) {
        const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        const found = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
        if (found) userId = found.id;
        if (list.users.length < 200) break;
        page += 1;
      }
    }
    if (!userId) throw created.error ?? new Error("Could not create this faculty account");

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        designation: data.designation || null,
        room_no: data.room_no || null,
        department_id: data.department_id ?? null,
        is_active: true,
      },
      { onConflict: "id" },
    );
    if (profileError) throw profileError;

    const { error: grantError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "faculty" }, { onConflict: "user_id,role" });
    if (grantError) throw grantError;

    return { ok: true, id: userId };
  });
