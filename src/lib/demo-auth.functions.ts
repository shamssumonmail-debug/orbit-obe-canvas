import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["super_admin", "obe_coordinator", "faculty"]),
});

/**
 * Provisions (or repairs) a demo account in the backend so the browser can hold a real
 * session — required for row-level security on the master-data tables.
 */
export const ensureDemoAccount = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let userId: string | null = null;

    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (created.data.user) {
      userId = created.data.user.id;
    } else {
      // Already exists — locate it and make sure the demo password still works.
      let page = 1;
      while (!userId && page <= 10) {
        const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        const found = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
        if (found) userId = found.id;
        if (list.users.length < 200) break;
        page += 1;
      }
      if (!userId) throw created.error ?? new Error("Could not provision demo account");
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.password,
        email_confirm: true,
      });
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: data.role }, { onConflict: "user_id,role" });
    if (roleError) throw roleError;

    return { ok: true };
  });
