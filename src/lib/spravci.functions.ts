import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function overSpravce(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw error;
  if (!data) throw new Error("Nemáte oprávnění správce.");
}

export const seznamSpravcu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await overSpravce(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: role, error } = await supabaseAdmin
      .from("user_roles")
      .select("id, user_id, created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: true });
    if (error) throw error;

    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const mapa = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    return (role ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      email: mapa.get(r.user_id) ?? "(neznámý e-mail)",
      jaSam: r.user_id === context.userId,
      created_at: r.created_at,
    }));
  });

export const pridejSpravce = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) => ({ email: String(input.email).trim().toLowerCase() }))
  .handler(async ({ data, context }) => {
    await overSpravce(context.supabase, context.userId);
    if (!data.email || !data.email.includes("@")) throw new Error("Zadejte platný e-mail.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) >= 2) {
      throw new Error("Správci mohou být nejvýše dva. Nejprve některého odeberte.");
    }

    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const user = (users?.users ?? []).find((u) => (u.email ?? "").toLowerCase() === data.email);
    if (!user) {
      throw new Error("Uživatel s tímto e-mailem zatím nemá účet. Nejprve ať se zaregistruje na stránce přihlášení.");
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw error;
    return { ok: true };
  });

export const odeberSpravce = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => ({ userId: String(input.userId) }))
  .handler(async ({ data, context }) => {
    await overSpravce(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("Nemůžete odebrat sami sebe.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    if (error) throw error;
    return { ok: true };
  });
