import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lišta správce.
 *
 * Když je obsluha přihlášená, prochází web jako každý jiný návštěvník a nemá
 * jak poznat, že je pořád přihlášená — což vedlo k tomu, že se ptala, jestli
 * vůbec je. Tahle lišta to říká na první pohled a zároveň dává rychlý odkaz
 * zpátky do správy.
 *
 * Zákazník ji nikdy neuvidí: zobrazí se jen tomu, kdo má oprávnění správce.
 *
 * Oprávnění se schválně ověřuje dotazem do databáze, ne serverovou funkcí.
 * Tahle lišta je součástí každé stránky webu, a když se do ní zatáhla
 * serverová funkce, rozbilo to vykreslování celého webu na serveru.
 * Číst vlastní roli smí přihlášený uživatel i z prohlížeče.
 */
export function ListaSpravce() {
  const { data } = useQuery({
    queryKey: ["lista-spravce"],
    queryFn: async () => {
      const { data: uzivatel } = await supabase.auth.getUser();
      if (!uzivatel.user) return null;
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uzivatel.user.id)
        .eq("role", "admin")
        .maybeSingle();
      return role ? { email: uzivatel.user.email ?? "" } : null;
    },
    // Přihlášení se mění zřídka, nemá smysl se ptát při každém překliknutí.
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (!data) return null;

  return (
    <div className="border-b-2 border-primary bg-primary/15 shadow-[0_0_18px_rgba(0,0,0,0.12)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm md:px-6">
        <span className="flex items-center gap-2.5">
          {/* Tepající tečka — na první pohled je vidět, že je režim správce aktivní. */}
          <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-bold uppercase tracking-wide text-primary">Režim správce</span>
          <span className="hidden text-foreground sm:inline">
            — jste přihlášeni{data.email && <span className="text-muted-foreground"> jako {data.email}</span>}
          </span>
        </span>

        <span className="flex items-center gap-4">
          <Link
            to="/admin"
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <LayoutGrid className="h-4 w-4" /> Správa prodejny
          </Link>
          <button
            type="button"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
          >
            <LogOut className="h-4 w-4" /> Odhlásit
          </button>
        </span>
      </div>
    </div>
  );
}
