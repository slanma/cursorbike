import { createFileRoute } from "@tanstack/react-router";

/**
 * „Jsi vzhůru?" — jednou denně sem zaklepe GitHub (soubor
 * .github/workflows/databaze-nespi.yml).
 *
 * Databáze Supabase zdarma po týdnu bez provozu usne a pak nejdou
 * objednávky ani správa. Tahle adresa udělá malý dotaz do databáze,
 * takže nikdy neusne. Nic nevrací, nic neukládá.
 */
export const Route = createFileRoute("/api/zije")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error } = await supabaseAdmin.from("nastaveni").select("klic").limit(1);
          if (error) throw error;
          return new Response("ok", { status: 200, headers: { "Cache-Control": "no-store" } });
        } catch {
          return new Response("databaze neodpovida", { status: 503, headers: { "Cache-Control": "no-store" } });
        }
      },
    },
  },
});
