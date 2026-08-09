import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Vrátí, zda je přihlášený uživatel správce.
 * Pokud v systému zatím žádný správce není, stane se jím první přihlášený uživatel
 * (jednorázové zavedení pro majitele prodejny).
 */
export const zjistiSpravce = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: jeSpravce, error } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (error) throw error;
    if (jeSpravce) return { admin: true, zaveden: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countErr) throw countErr;

    if ((count ?? 0) > 0) return { admin: false, zaveden: false };

    const { error: insErr } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (insErr) throw insErr;
    return { admin: true, zaveden: true };
  });
