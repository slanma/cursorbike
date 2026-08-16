import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { nactiZpravy, STAVY_ZPRAVY, stavLabel } from "@/lib/eshop";

export const Route = createFileRoute("/_authenticated/admin/zpravy")({
  component: SpravaZprav,
});

function SpravaZprav() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["admin-zpravy"], queryFn: nactiZpravy });

  const zmenitStav = useMutation({
    mutationFn: async ({ id, stav }: { id: string; stav: string }) => {
      const { error } = await supabase.from("zpravy").update({ stav }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stav zprávy změněn");
      qc.invalidateQueries({ queryKey: ["admin-zpravy"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const zpravy = data ?? [];

  return (
    <div className="grid gap-6">
      <h2 className="section-title text-2xl">Zprávy z kontaktního formuláře</h2>

      {isLoading ? (
        <p className="text-muted-foreground">Načítáme…</p>
      ) : zpravy.length === 0 ? (
        <p className="text-muted-foreground">Zatím žádné zprávy.</p>
      ) : (
        zpravy.map((z) => (
          <article key={z.id} className="rounded-lg border bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">{z.jmeno}</h3>
                <p className="text-sm text-muted-foreground">{new Date(z.created_at).toLocaleString("cs-CZ")}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <a href={`mailto:${z.email}`} className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
                    <Mail className="h-4 w-4" /> {z.email}
                  </a>
                  {z.telefon && (
                    <a
                      href={`tel:${z.telefon.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" /> {z.telefon}
                    </a>
                  )}
                </div>
              </div>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm font-semibold"
                value={z.stav}
                onChange={(e) => zmenitStav.mutate({ id: z.id, stav: e.target.value })}
              >
                {STAVY_ZPRAVY.map((s) => (
                  <option key={s} value={s}>
                    {stavLabel[s]}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-4 whitespace-pre-wrap rounded bg-surface p-4 text-sm">{z.zprava}</p>
          </article>
        ))
      )}
    </div>
  );
}
