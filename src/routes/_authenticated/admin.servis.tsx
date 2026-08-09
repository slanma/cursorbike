import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STAVY_POPTAVKY, stavLabel, type DbPoptavka } from "@/lib/eshop";

export const Route = createFileRoute("/_authenticated/admin/servis")({
  component: SpravaServisu,
});

function SpravaServisu() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["admin-poptavky"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servis_poptavky")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbPoptavka[];
    },
  });

  const zmenitStav = useMutation({
    mutationFn: async ({ id, stav }: { id: string; stav: string }) => {
      const { error } = await supabase.from("servis_poptavky").update({ stav }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stav poptávky změněn");
      qc.invalidateQueries({ queryKey: ["admin-poptavky"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const poptavky = data ?? [];

  return (
    <div className="grid gap-6">
      <h2 className="section-title text-2xl">Poptávky servisu</h2>

      {poptavky.length === 0 ? (
        <p className="text-muted-foreground">Zatím žádné poptávky.</p>
      ) : (
        poptavky.map((p) => (
          <article key={p.id} className="rounded-lg border bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">{p.jmeno}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(p.created_at).toLocaleString("cs-CZ")} · {p.email}
                  {p.telefon ? ` · ${p.telefon}` : ""}
                </p>
                <p className="mt-1 text-sm font-semibold text-primary">
                  {p.typ_sluzby ?? "Servis"}
                  {p.termin ? ` · preferovaný termín: ${p.termin}` : ""}
                </p>
              </div>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm font-semibold"
                value={p.stav}
                onChange={(e) => zmenitStav.mutate({ id: p.id, stav: e.target.value })}
              >
                {STAVY_POPTAVKY.map((s) => (
                  <option key={s} value={s}>
                    {stavLabel[s]}
                  </option>
                ))}
              </select>
            </div>
            {p.popis && <p className="mt-3 rounded bg-surface p-3 text-sm text-muted-foreground">{p.popis}</p>}
          </article>
        ))
      )}
    </div>
  );
}
