import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bike, CircleHelp, ClipboardList, ExternalLink, House, LogOut, Settings, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { zjistiSpravce } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

/**
 * Jen pět hlavních položek — víc si starší obchodník nezapamatuje.
 * Méně časté stránky jsou schované v podmenu u své skupiny.
 */
const skupiny = [
  { to: "/admin", label: "Dnes", icon: House, cesty: ["/admin"], pod: [] },
  {
    to: "/admin/produkty",
    label: "Zboží",
    icon: Bike,
    cesty: ["/admin/produkty", "/admin/kategorie", "/admin/feedy", "/admin/prehled", "/admin/stary-web"],
    pod: [
      { to: "/admin/produkty", label: "Seznam zboží" },
      { to: "/admin/feedy", label: "Stáhnout od dodavatele" },
      { to: "/admin/prehled", label: "Měsíční přehled" },
      { to: "/admin/kategorie", label: "Kategorie" },
      { to: "/admin/stary-web", label: "Převzít starý web" },
    ],
  },
  { to: "/admin/ceny", label: "Ceny", icon: Tag, cesty: ["/admin/ceny"], pod: [] },
  {
    to: "/admin/objednavky",
    label: "Objednávky",
    icon: ClipboardList,
    cesty: ["/admin/objednavky", "/admin/servis", "/admin/zpravy"],
    pod: [
      { to: "/admin/objednavky", label: "Objednávky" },
      { to: "/admin/servis", label: "Servis" },
      { to: "/admin/zpravy", label: "Zprávy z webu" },
    ],
  },
  {
    to: "/admin/nastaveni",
    label: "Nastavení",
    icon: Settings,
    cesty: ["/admin/nastaveni", "/admin/spravci"],
    pod: [
      { to: "/admin/nastaveni", label: "Údaje o obchodě" },
      { to: "/admin/spravci", label: "Kdo má přístup" },
    ],
  },
] as const;

const patriDo = (cesta: string, cesty: readonly string[]) =>
  cesty.some((c) => (c === "/admin" ? cesta === "/admin" || cesta === "/admin/" : cesta.startsWith(c)));

function AdminLayout() {
  const navigate = useNavigate();
  const cesta = useRouterState({ select: (s) => s.location.pathname });
  const aktivni = skupiny.find((s) => patriDo(cesta, s.cesty)) ?? skupiny[0];
  // Kdo je vlastně přihlášený — hodí se, když má prodejna dva účty.
  const prihlaseny = useQuery({
    queryKey: ["prihlaseny-uzivatel"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.email ?? null,
    staleTime: 5 * 60_000,
  });
  const prihlasenyEmail = prihlaseny.data;
  const overit = useServerFn(zjistiSpravce);
  const { data, isLoading } = useQuery({ queryKey: ["je-spravce"], queryFn: () => overit({}) });

  if (isLoading) {
    return <div className="mx-auto max-w-5xl px-4 py-20 text-muted-foreground md:px-6">Načítáme správu…</div>;
  }

  if (!data?.admin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center md:px-6">
        <h1 className="section-title text-3xl">Nemáte přístup do správy</h1>
        <p className="mt-3 text-muted-foreground">
          Tento účet nemá oprávnění správce. Do správy se dostanou jen účty, kterým roli výslovně
          přidělil stávající správce.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pokud jste roli právě dostali, odhlaste se a přihlaste znovu — oprávnění se načítá
          při přihlášení.
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
        >
          Odhlásit se
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-lg md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-3xl">Správa obchodu</h1>
          {prihlasenyEmail && <p className="mt-1 text-base text-muted-foreground">Přihlášeni jako {prihlasenyEmail}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin"
            hash="pomoc"
            className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-amber-100 px-5 font-bold text-amber-950 hover:bg-amber-200"
          >
            <CircleHelp className="h-5 w-5" /> Nevím si rady
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 px-5 font-semibold hover:border-primary"
          >
            <ExternalLink className="h-5 w-5" /> Otevřít web
          </a>
          <Button
            variant="outline"
            className="min-h-12 px-5 text-base"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="mr-2 h-5 w-5" /> Odhlásit se
          </Button>
        </div>
      </div>

      <nav aria-label="Hlavní menu správy" className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {skupiny.map((s) => {
          const je = s === aktivni;
          return (
            <Link
              key={s.to}
              to={s.to}
              aria-current={je ? "page" : undefined}
              className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 px-4 text-lg font-bold transition-colors ${
                je ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary hover:bg-primary/5"
              }`}
            >
              <s.icon className="h-5 w-5" />
              {s.label}
            </Link>
          );
        })}
      </nav>

      {aktivni.pod.length > 0 && (
        <nav aria-label={`Podmenu ${aktivni.label}`} className="mt-3 flex flex-wrap gap-2">
          {aktivni.pod.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="inline-flex min-h-11 items-center rounded-full border px-4 text-base font-semibold hover:border-primary"
              activeProps={{ className: "border-primary bg-accent text-accent-foreground" }}
            >
              {p.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
