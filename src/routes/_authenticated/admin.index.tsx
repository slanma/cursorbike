import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCena } from "@/lib/produkty";
import { stavLabel } from "@/lib/eshop";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Prehled,
});

function Prehled() {
  const { data } = useQuery({
    queryKey: ["admin-prehled"],
    queryFn: async () => {
      const [produkty, objednavky, poptavky] = await Promise.all([
        supabase.from("produkty").select("id", { count: "exact", head: true }),
        supabase.from("objednavky").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("servis_poptavky").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      return {
        pocetProduktu: produkty.count ?? 0,
        objednavky: objednavky.data ?? [],
        poptavky: poptavky.data ?? [],
      };
    },
  });

  return (
    <div className="grid gap-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Karta nazev="Produkty v e-shopu" hodnota={String(data?.pocetProduktu ?? 0)} to="/admin/produkty" />
        <Karta nazev="Nové objednávky" hodnota={String((data?.objednavky ?? []).filter((o) => o.stav === "nova").length)} to="/admin/objednavky" />
        <Karta nazev="Nové poptávky servisu" hodnota={String((data?.poptavky ?? []).filter((p) => p.stav === "nova").length)} to="/admin/servis" />
      </div>

      <section className="rounded-lg border bg-card p-6 shadow-card">
        <h2 className="section-title text-xl">Poslední objednávky</h2>
        {(data?.objednavky ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Zatím žádné objednávky.</p>
        ) : (
          <ul className="mt-4 divide-y">
            {data?.objednavky.map((o) => (
              <li key={o.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                <span className="font-semibold">{o.jmeno}</span>
                <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("cs-CZ")}</span>
                <span className="font-bold">{formatCena(o.celkem)}</span>
                <span className="text-muted-foreground">{stavLabel[o.stav] ?? o.stav}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border bg-card p-6 shadow-card">
        <h2 className="section-title text-xl">Poslední poptávky servisu</h2>
        {(data?.poptavky ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Zatím žádné poptávky.</p>
        ) : (
          <ul className="mt-4 divide-y">
            {data?.poptavky.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                <span className="font-semibold">{p.jmeno}</span>
                <span className="text-muted-foreground">{p.typ_sluzby ?? "—"}</span>
                <span className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString("cs-CZ")}</span>
                <span className="text-muted-foreground">{stavLabel[p.stav] ?? p.stav}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Karta({ nazev, hodnota, to }: { nazev: string; hodnota: string; to: string }) {
  return (
    <Link to={to} className="rounded-lg border bg-card p-6 shadow-card transition-shadow hover:shadow-lg">
      <div className="text-sm text-muted-foreground">{nazev}</div>
      <div className="mt-2 text-3xl font-bold">{hodnota}</div>
    </Link>
  );
}
