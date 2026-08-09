import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STAVY_OBJEDNAVKY, stavLabel, type DbObjednavka, type DbObjednavkaPolozka } from "@/lib/eshop";
import { formatCena } from "@/lib/produkty";

export const Route = createFileRoute("/_authenticated/admin/objednavky")({
  component: SpravaObjednavek,
});

function SpravaObjednavek() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["admin-objednavky"],
    queryFn: async () => {
      const [o, p] = await Promise.all([
        supabase.from("objednavky").select("*").order("created_at", { ascending: false }),
        supabase.from("objednavka_polozky").select("*"),
      ]);
      if (o.error) throw o.error;
      if (p.error) throw p.error;
      return {
        objednavky: (o.data ?? []) as DbObjednavka[],
        polozky: (p.data ?? []) as DbObjednavkaPolozka[],
      };
    },
  });

  const zmenitStav = useMutation({
    mutationFn: async ({ id, stav }: { id: string; stav: string }) => {
      const { error } = await supabase.from("objednavky").update({ stav }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stav objednávky změněn");
      qc.invalidateQueries({ queryKey: ["admin-objednavky"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const objednavky = data?.objednavky ?? [];

  return (
    <div className="grid gap-6">
      <h2 className="section-title text-2xl">Objednávky</h2>

      {objednavky.length === 0 ? (
        <p className="text-muted-foreground">Zatím žádné objednávky.</p>
      ) : (
        objednavky.map((o) => {
          const polozky = (data?.polozky ?? []).filter((p) => p.objednavka_id === o.id);
          return (
            <article key={o.id} className="rounded-lg border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">{o.jmeno}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("cs-CZ")} · {o.email}
                    {o.telefon ? ` · ${o.telefon}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold">{formatCena(o.celkem)}</span>
                  <select
                    className="h-10 rounded-md border bg-background px-3 text-sm font-semibold"
                    value={o.stav}
                    onChange={(e) => zmenitStav.mutate({ id: o.id, stav: e.target.value })}
                  >
                    {STAVY_OBJEDNAVKY.map((s) => (
                      <option key={s} value={s}>
                        {stavLabel[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <ul className="mt-4 divide-y border-t pt-2 text-sm">
                {polozky.map((p) => (
                  <li key={p.id} className="flex justify-between gap-4 py-2">
                    <span>
                      {p.nazev} <span className="text-muted-foreground">× {p.pocet}</span>
                    </span>
                    <span className="font-semibold">{formatCena(p.cena * p.pocet)}</span>
                  </li>
                ))}
              </ul>

              {o.poznamka && <p className="mt-3 rounded bg-surface p-3 text-sm text-muted-foreground">{o.poznamka}</p>}
            </article>
          );
        })
      )}
    </div>
  );
}
